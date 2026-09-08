// PostToolUse hook para Write|Edit|MultiEdit: Claude Code no expone la ruta
// del archivo editado como variable de entorno, la manda como JSON por
// stdin (tool_input.file_path). Usa la API de Prettier en vez de invocar
// `npx prettier` como subproceso: en Windows lanzar npx (un shim .cmd)
// sin shell:true falla, y con shell:true el filePath no queda escapado,
// lo que abriria una inyeccion de comandos si el nombre de archivo
// llevara caracteres de shell. Formatear en proceso evita ambos problemas
// y de paso es mas rapido (sin arrancar un subproceso por cada edicion).
const fs = require('fs');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

async function main() {
  const raw = readStdin();
  if (!raw) return;

  let filePath;
  try {
    filePath = JSON.parse(raw)?.tool_input?.file_path;
  } catch {
    return;
  }

  // Si filePath faltara, formatear "nada" debe ser un no-op, nunca un
  // fallback a formatear el proyecto entero.
  if (!filePath || !fs.existsSync(filePath)) return;

  let prettier;
  try {
    prettier = require('prettier');
  } catch {
    return; // Prettier no instalado en este proyecto.
  }

  try {
    const config = (await prettier.resolveConfig(filePath)) ?? {};
    const source = fs.readFileSync(filePath, 'utf8');
    const formatted = await prettier.format(source, { ...config, filepath: filePath });
    if (formatted !== source) fs.writeFileSync(filePath, formatted);
  } catch {
    // Sin parser para esta extension (ej. .env) u otro fallo puntual: no
    // debe romper el flujo de edicion de Claude Code.
  }
}

main();
