#!/usr/bin/env python3
"""
Extrae el modelo de datos (tablas, columnas, PK, FK, vistas, triggers)
directamente de los archivos .sql de migraciones — no se transcribe nada
a mano. Genera:
  - schema.json   (el modelo extraído, para auditar contra el SQL)
  - er.dot        (diagrama Graphviz generado a partir de schema.json)

Fuente: sesim-backend/db/migrations/*.sql (en orden numérico).
"""
import glob
import json
import re
import sys
import sqlparse

MIGRATIONS_DIR = "/home/claude/sesim-backend/db/migrations"


def load_statements():
    """Concatena las migraciones en orden y las separa en sentencias SQL
    individuales usando sqlparse (respeta comentarios, strings, etc.)."""
    files = sorted(glob.glob(f"{MIGRATIONS_DIR}/*.sql"))
    stmts = []
    for path in files:
        sql = open(path).read()
        for raw in sqlparse.split(sql):
            raw = raw.strip()
            if not raw:
                continue
            stmts.append({"file": path.split("/")[-1], "sql": raw})
    return stmts


def strip_sql_comments(sql):
    sql = re.sub(r"--[^\n]*", "", sql)
    sql = re.sub(r"/\*.*?\*/", "", sql, flags=re.S)
    return sql


def split_top_level(body):
    """Divide 'body' (contenido entre los parentesis de un CREATE TABLE)
    en items separados por comas de nivel superior, respetando parentesis
    anidados (defaults con funciones, check(...), etc.)."""
    items, depth, cur = [], 0, []
    for ch in body:
        if ch == "(":
            depth += 1
            cur.append(ch)
        elif ch == ")":
            depth -= 1
            cur.append(ch)
        elif ch == "," and depth == 0:
            items.append("".join(cur).strip())
            cur = []
        else:
            cur.append(ch)
    if cur:
        items.append("".join(cur).strip())
    return [i for i in items if i]


def extract_paren_body(sql, start_idx):
    """A partir del indice del primer '(' despues de CREATE TABLE ... ,
    devuelve (body, end_idx) balanceando parentesis."""
    assert sql[start_idx] == "("
    depth = 0
    for i in range(start_idx, len(sql)):
        if sql[i] == "(":
            depth += 1
        elif sql[i] == ")":
            depth -= 1
            if depth == 0:
                return sql[start_idx + 1 : i], i
    raise ValueError("parentesis no balanceado")


TYPE_RE = re.compile(
    r"^(?P<name>\w+)\s+(?P<type>uuid|text|boolean|jsonb|timestamptz|integer|bigint|numeric|double precision)\b(?P<rest>.*)$",
    re.I | re.S,
)


def parse_column(item):
    m = TYPE_RE.match(item.strip())
    if not m:
        return None
    name, ftype, rest = m.group("name"), m.group("type"), m.group("rest")
    rest_l = rest.lower()
    is_pk = "primary key" in rest_l
    is_unique = re.search(r"\bunique\b", rest_l) is not None
    is_not_null = "not null" in rest_l
    fk = None
    fk_m = re.search(r"references\s+([\w\.]+)\s*\(\s*(\w+)\s*\)", rest, re.I)
    if fk_m:
        fk = {"table": fk_m.group(1), "column": fk_m.group(2)}
    on_delete_m = re.search(r"on delete (cascade|set null|restrict|no action)", rest_l)
    return {
        "name": name,
        "type": ftype,
        "pk": is_pk,
        "unique": is_unique,
        "not_null": is_not_null,
        "fk": fk,
        "on_delete": on_delete_m.group(1) if on_delete_m else None,
    }


def parse_table_constraint(item):
    """Lineas de tabla que empiezan con 'constraint <nombre> check(...)' u
    otro tipo de constraint con nombre, no columnas."""
    m = re.match(r"^constraint\s+(\w+)\s+check\s*\((.*)\)$", item.strip(), re.I | re.S)
    if m:
        return {"kind": "check", "name": m.group(1), "expr": " ".join(m.group(2).split())}
    m = re.match(r"^constraint\s+(\w+)\s+(.*)$", item.strip(), re.I | re.S)
    if m:
        return {"kind": "other", "name": m.group(1), "expr": " ".join(m.group(2).split())}
    return None


def extract_tables(all_sql_by_file):
    tables = []
    for fname, sql in all_sql_by_file:
        sql_nc = strip_sql_comments(sql)
        for m in re.finditer(
            r"create\s+table\s+(?:if\s+not\s+exists\s+)?([\w\.]+)\s*\(",
            sql_nc,
            re.I,
        ):
            table_name = m.group(1)
            body, _end = extract_paren_body(sql_nc, m.end() - 1)
            items = split_top_level(body)
            columns, constraints = [], []
            for item in items:
                if re.match(r"^constraint\b", item.strip(), re.I):
                    c = parse_table_constraint(item)
                    if c:
                        constraints.append(c)
                    continue
                col = parse_column(item)
                if col:
                    columns.append(col)
            tables.append(
                {
                    "name": table_name,
                    "source_file": fname,
                    "columns": columns,
                    "constraints": constraints,
                }
            )
    return tables


def extract_views(all_sql_by_file):
    views = []
    for fname, sql in all_sql_by_file:
        sql_nc = strip_sql_comments(sql)
        for m in re.finditer(
            r"create\s+or\s+replace\s+view\s+([\w\.]+)\s*(?:with\s*\(([^)]*)\))?\s*as\s+(select.*?);",
            sql_nc,
            re.I | re.S,
        ):
            view_name, opts, select_body = m.group(1), m.group(2) or "", m.group(3)
            security_invoker = "security_invoker" in opts.lower() and "true" in opts.lower()
            from_tables = re.findall(r"\bfrom\s+([\w\.]+)(?:\s+(\w+))?", select_body, re.I)
            join_tables = re.findall(
                r"\b(?:left\s+join|join)\s+([\w\.]+)(?:\s+(\w+))?", select_body, re.I
            )
            sources = []
            for tbl, alias in from_tables + join_tables:
                sources.append({"table": tbl, "alias": alias or tbl})
            views.append(
                {
                    "name": view_name,
                    "source_file": fname,
                    "security_invoker": security_invoker,
                    "sources": sources,
                }
            )
    return views


def extract_triggers(all_sql_by_file):
    triggers = []
    for fname, sql in all_sql_by_file:
        sql_nc = strip_sql_comments(sql)
        for m in re.finditer(
            r"create\s+trigger\s+(\w+)\s+(after|before)\s+([\w\s]+?)\s+on\s+([\w\.]+)\s+for\s+each\s+row\s+execute\s+function\s+([\w\.]+)\s*\(\)",
            sql_nc,
            re.I,
        ):
            name, timing, events, table, func = m.groups()
            # busca, en el cuerpo de la funcion (misma migracion), en que
            # otra(s) tabla(s) hace INSERT -- asi el diagrama no da por
            # hecho la relacion, la lee del propio codigo del trigger.
            writes_to = sorted(
                set(
                    t
                    for t in re.findall(
                        r"insert\s+into\s+([\w\.]+)", sql_nc, re.I
                    )
                    if t.lower() != table.lower()
                )
            )
            triggers.append(
                {
                    "name": name,
                    "table": table,
                    "function": func,
                    "events": " ".join(events.split()).lower(),
                    "writes_to": writes_to,
                    "source_file": fname,
                }
            )
    return triggers


def main():
    files = sorted(glob.glob(f"{MIGRATIONS_DIR}/*.sql"))
    all_sql_by_file = [(f.split("/")[-1], open(f).read()) for f in files]

    tables = extract_tables(all_sql_by_file)
    views = extract_views(all_sql_by_file)
    triggers = extract_triggers(all_sql_by_file)

    model = {"tables": tables, "views": views, "triggers": triggers}
    with open("/home/claude/diagrams/schema.json", "w") as f:
        json.dump(model, f, indent=2, ensure_ascii=False)

    print(f"Tablas encontradas: {[t['name'] for t in tables]}")
    for t in tables:
        print(f"  {t['name']}:")
        for c in t["columns"]:
            flags = []
            if c["pk"]:
                flags.append("PK")
            if c["fk"]:
                flags.append(f"FK->{c['fk']['table']}({c['fk']['column']})")
            if c["unique"]:
                flags.append("UNIQUE")
            if c["not_null"]:
                flags.append("NOT NULL")
            print(f"    - {c['name']} {c['type']} {' '.join(flags)}")
        for cc in t["constraints"]:
            print(f"    [constraint] {cc['name']}: {cc['expr'][:80]}")
    print(f"\nVistas encontradas: {[v['name'] for v in views]}")
    for v in views:
        print(f"  {v['name']}  security_invoker={v['security_invoker']}  fuentes={[s['table'] for s in v['sources']]}")
    print(f"\nTriggers encontrados: {[t['name'] for t in triggers]}")
    for tr in triggers:
        print(f"  {tr['name']} on {tr['table']} ({tr['events']}) -> {tr['function']}  escribe_en={tr['writes_to']}")


if __name__ == "__main__":
    main()
