#!/usr/bin/env python3
"""
Genera er.dot a partir de schema.json (que a su vez viene de parsear el SQL
real de las migraciones, ver extract_schema.py). Ninguna tabla, columna,
PK/FK o valor de enum se escribe a mano aqui: todo sale del diccionario
`model` cargado desde el JSON extraido.
"""
import json
import re

model = json.load(open("/home/claude/diagrams/schema.json"))

# --- helpers -----------------------------------------------------------

def enum_values_for(table, column):
    """Busca, entre los CHECK constraints de la tabla, uno del tipo
    "<columna> in ('a','b',...)" y devuelve la lista de valores -- se lee
    del propio texto del constraint extraido del SQL, no se retipea."""
    for c in table["constraints"]:
        if c["kind"] != "check":
            continue
        m = re.match(rf"^{column}\s+in\s*\((.*)\)$", c["expr"].strip(), re.I)
        if m:
            return [v.strip().strip("'") for v in m.group(1).split(",")]
    return None


def find_table(name):
    for t in model["tables"]:
        if t["name"] == name:
            return t
    return None


def col_row(table, col):
    parts = [f"<b>{col['name']}</b>" if col["pk"] or col["fk"] else col["name"]]
    type_str = col["type"]
    tags = []
    if col["pk"]:
        tags.append("PK")
    if col["fk"]:
        tags.append(f"FK&#8594;{col['fk']['table']}")
    if col["unique"] and not col["pk"]:
        tags.append("UNIQUE")
    enum_vals = enum_values_for(table, col["name"])
    suffix = ""
    if enum_vals:
        suffix = f'<br align="left"/><font point-size="13">({" | ".join(enum_vals)})</font>'
    tag_str = "  " + " ".join(tags) if tags else ""
    label = f"{parts[0]} <font point-size='13'>{type_str}</font>{tag_str}{suffix}"
    return f'<tr><td align="left" balign="left"><font point-size="16">{label}</font></td></tr>'


def table_html(table, header_color, note=None):
    rows = [col_row(table, c) for c in table["columns"]]
    note_row = (
        f'<tr><td align="left"><font point-size="13" color="#666666">{note}</font></td></tr>'
        if note
        else ""
    )
    return f"""<
    <table border="1" cellborder="0" cellspacing="0" cellpadding="8" bgcolor="#FFFFFF">
      <tr><td bgcolor="{header_color}"><font color="white" point-size="19"><b>{table['name']}</b></font></td></tr>
      {note_row}
      {''.join(rows)}
    </table>
  >"""


def view_html(view, header_color="#53565A"):
    src = ", ".join(sorted(set(s["table"] for s in view["sources"])))
    inv = "security_invoker = true" if view["security_invoker"] else ""
    return f"""<
    <table border="1" cellborder="0" cellspacing="0" cellpadding="8" bgcolor="#F4F5F7">
      <tr><td bgcolor="{header_color}"><font color="white" point-size="17"><b>{view['name']}</b>  (vista)</font></td></tr>
      <tr><td align="left"><font point-size="13">{inv}</font></td></tr>
      <tr><td align="left"><font point-size="13">fuente: {src}</font></td></tr>
    </table>
  >"""


perfil = find_table("core.perfil")
bitacora = find_table("core.bitacora")
api_perfil = next(v for v in model["views"] if v["name"] == "api.perfil")
api_bitacora = next(v for v in model["views"] if v["name"] == "api.bitacora")
trigger = model["triggers"][0]

# auth.users no es una tabla de SESIM (la crea Supabase) asi que no viene en
# nuestras migraciones -- se agrega como referencia fija minima, marcada
# explicitamente como externa, en vez de inventarle columnas de negocio.
auth_users_html = """<
    <table border="1" cellborder="0" cellspacing="0" cellpadding="8" bgcolor="#F4F5F7">
      <tr><td bgcolor="#183B33"><font color="white" point-size="19"><b>auth.users</b></font></td></tr>
      <tr><td align="left"><font point-size="13" color="#666666">tabla de Supabase/GoTrue (no aparece en db/migrations/)</font></td></tr>
      <tr><td align="left"><font point-size="16"><b>id</b> uuid  PK</font></td></tr>
    </table>
  >"""

dot = f"""digraph ER {{
  graph [rankdir=TB, fontname="Helvetica", bgcolor="white", nodesep=0.8, ranksep=0.9, pad="0.3"];
  node [shape=plaintext, fontname="Helvetica"];
  edge [fontname="Helvetica", fontsize=14, color="#691C32", penwidth=1.3];

  auth_users [label={auth_users_html}];
  core_perfil [label={table_html(perfil, "#9F2241")}];
  core_bitacora [label={table_html(bitacora, "#254E45")}];
  api_perfil [label={view_html(api_perfil)}];
  api_bitacora [label={view_html(api_bitacora)}];

  {{ rank=same; auth_users; core_perfil; }}
  {{ rank=same; api_perfil; api_bitacora; }}

  auth_users -> core_perfil [label=" 1:1 (id_usuario)", dir=back, arrowtail=crow, arrowhead=tee];
  core_perfil -> core_bitacora [label="  trigger {trigger['name']}\\n(escribe en {trigger['writes_to'][0]})", color="#183B33", penwidth=1.6];
  auth_users -> core_bitacora [label=" 1:N (actor_id_usuario /\\l objetivo_id_usuario)", dir=back, arrowtail=crow, arrowhead=tee, style=dotted, constraint=false];
  core_perfil -> api_perfil [label=" RLS ", style=dashed, color="#53565A"];
  core_bitacora -> api_bitacora [label=" RLS ", style=dashed, color="#53565A"];
}}
"""

open("/home/claude/diagrams/er.dot", "w").write(dot)
print("er.dot generado a partir de schema.json")
