import docx
from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

def create_simple_word_report(filename):
    doc = docx.Document()

    # Título principal
    p_title = doc.add_paragraph()
    run_title = p_title.add_run("Informe de Seguridad OWASP Top 10")
    run_title.font.name = 'Calibri'
    run_title.font.size = Pt(18)
    run_title.font.bold = True

    # Subtítulo / Datos del proyecto
    p_sub = doc.add_paragraph("Proyecto: Sistema de Gestión TM\nFecha: Octubre 2026\n")

    # 1. Introducción
    doc.add_heading("1. ¿De qué trata este informe?", level=1)
    doc.add_paragraph(
        "Este documento revisa la seguridad del proyecto usando como guía las 10 reglas principales "
        "de seguridad web de OWASP (OWASP Top 10). El objetivo es evaluar las medidas de protección "
        "implementadas en los módulos del sistema (Usuarios, Bodega, Taller y Logística) y definir "
        "las acciones necesarias antes de su publicación."
    )

    # 2. Resumen de Estado en Tabla Sencilla
    doc.add_heading("2. Resumen de Estado por Puntos OWASP", level=1)
    
    table_data = [
        ["Puntos de Seguridad OWASP", "¿Cómo está en el proyecto?", "Estado"],
        ["1. Permisos y Accesos (Broken Access Control)", "Bien controlado con roles (Admin, Bodega, Taller, Logística)", "Todo Bien"],
        ["2. Cifrado y Claves (Cryptographic Failures)", "Claves encriptadas en DB. Falta asegurar SECRET_KEY al publicar", "Ajustar en Producción"],
        ["3. Inyección (SQLi y XSS)", "Protegido de forma automática por Django ORM y React 19", "Todo Bien"],
        ["4. Diseño del Sistema (Insecure Design)", "Bueno, segregación de roles y borrado lógico de usuarios", "Todo Bien"],
        ["5. Ajustes del Servidor (Security Misconfiguration)", "En modo desarrollo. Falta cambiar DEBUG=False al publicar", "Ajustar en Producción"],
        ["6. Componentes y Librerías (Vulnerable Components)", "Librerías actualizadas y modernas (Python 3.12, Django 6, React 19)", "Todo Bien"],
        ["7. Login y Autenticación (Auth Failures)", "Autenticación segura por JWT. Conviene agregar límite de intentos", "Recomendación"],
        ["8. Integridad de Datos (Data Integrity Failures)", "Uso de transacciones atómicas (@transaction.atomic)", "Todo Bien"],
        ["9. Historial y Registros (Logging & Monitoring)", "Modelos guardan usuario responsable de cada acción", "Recomendación"],
        ["10. Solicitudes Falsas (SSRF)", "No aplica, el sistema no consulta URLs externas ingresadas por usuarios", "Todo Bien"],
    ]

    table = doc.add_table(rows=len(table_data), cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = 'Table Grid'

    for row_idx, row in enumerate(table.rows):
        for col_idx, cell in enumerate(row.cells):
            cell.text = table_data[row_idx][col_idx]
            p = cell.paragraphs[0]
            if row_idx == 0:
                for run in p.runs:
                    run.font.bold = True

    doc.add_paragraph("\n")

    # 3. Explicación Detallada Punto por Punto
    doc.add_heading("3. Explicación Detallada Punto por Punto", level=1)

    sections_detail = [
        ("1. Control de Permisos (Broken Access Control)",
         "¿Qué es?: Evitar que un usuario normal entre a ver o modificar cosas que solo le corresponden al administrador o a otro rol.\n"
         "¿Cómo está en el proyecto?: Está bien protegido. El backend en Django REST Framework revisa si el usuario está conectado y qué rol tiene antes de permitir cualquier acción (IsAdminUserOnly, IsBodegueroOrAdmin). Por ejemplo, solo el Administrador puede crear Órdenes de Ingreso o cuentas de usuario, mientras que el Bodeguero solo procesa ingresos y salidas de repuestos."),
        
        ("2. Cifrado de Contraseñas y Datos (Cryptographic Failures)",
         "¿Qué es?: Guardar las contraseñas de forma oculta para que si alguien accede a la base de datos no las pueda leer en texto plano.\n"
         "¿Cómo está en el proyecto?: Las claves se guardan encriptadas con PBKDF2 SHA256. Las sesiones utilizan tokens JWT firmados (rest_framework_simplejwt). Al publicar la página en internet, se debe cambiar la SECRET_KEY por una clave privada en el archivo .env."),
        
        ("3. Inyección de Código (SQLi / XSS)",
         "¿Qué es?: Evitar que un atacante escriba código malicioso en los buscadores o formularios para alterar la base de datos o infectar la pantalla.\n"
         "¿Cómo está en el proyecto?: Protegido automáticamente. Django ORM parametriza las consultas a la base de datos previniendo SQL Injection, y React 19 escapa dinámicamente los datos en pantalla previniendo XSS."),
        
        ("4. Diseño del Sistema (Insecure Design)",
         "¿Qué es?: Diseñar los flujos de trabajo pensando en la seguridad desde el principio.\n"
         "¿Cómo está en el proyecto?: Procesos bien segregados por roles. Se utiliza borrado lógico (activo=False) para deshabilitar usuarios sin borrar su historial ni afectar registros antiguos."),
        
        ("5. Configuración del Servidor (Security Misconfiguration)",
         "¿Qué es?: Asegurar que las opciones de prueba y desarrollo estén desactivadas en el servidor final.\n"
         "¿Cómo está en el proyecto?: En desarrollo local se utiliza DEBUG = True y CORS_ALLOW_ALL_ORIGINS = True. Al subir el proyecto a producción, se debe poner DEBUG = False y autorizar solo el dominio de la empresa."),
        
        ("6. Librerías y Herramientas (Vulnerable Components)",
         "¿Qué es?: Evitar usar librerías desactualizadas con fallos conocidos.\n"
         "¿Cómo está en el proyecto?: Todo el software utiliza versiones modernas y soportadas (Python 3.12, Django 6.0, React 19, Axios 1.19)."),
        
        ("7. Login y Contraseñas (Authentication Failures)",
         "¿Qué es?: Proteger el formulario de inicio de sesión contra intentos masivos o adivinanzas de contraseña.\n"
         "¿Cómo está en el proyecto?: Autenticación segura mediante tokens JWT. Conviene habilitar un límite de intentos fallidos (Rate Limiting) para evitar ataques de fuerza bruta en /api/auth/login/."),
        
        ("8. Integridad de los Datos (Data Integrity)",
         "¿Qué es?: Garantizar que las operaciones complejas (como registrar una orden de ingreso con varios repuestos) se completen enteras o se cancelen por completo si ocurre una falla.\n"
         "¿Cómo está en el proyecto?: Uso de transacciones atómicas (@transaction.atomic). Si algo falla durante el proceso, el sistema deshace los cambios evitando inconsistencias."),
        
        ("9. Registros y Bitácora (Logging & Monitoring)",
         "¿Qué es?: Mantener un historial auditable de las acciones del sistema.\n"
         "¿Cómo está en el proyecto?: Los modelos registran quién creó cada usuario, quién generó cada orden y quién realizó cada ingreso/salida de repuestos."),
        
        ("10. Solicitudes Falsas del Servidor (SSRF)",
         "¿Qué es?: Prevenir que el servidor realice solicitudes a sitios externos no autorizados.\n"
         "¿Cómo está en el proyecto?: No aplica riesgo ya que la aplicación no procesa ni consulta URLs externas ingresadas por usuarios.")
    ]

    for title, body in sections_detail:
        doc.add_heading(title, level=2)
        doc.add_paragraph(body)

    # 4. Lista de Verificación
    doc.add_heading("4. Lista de Verificación Antes de Publicar (Producción)", level=1)
    
    checklist = [
        "Cambiar DEBUG = True a DEBUG = False en settings.py.",
        "Configurar SECRET_KEY en el archivo de variables de entorno (.env).",
        "Restringir los orígenes de CORS al dominio oficial de la empresa.",
        "Activar candado de 5 intentos fallidos en el formulario de inicio de sesión (Rate Limiting)."
    ]

    for item in checklist:
        doc.add_paragraph(item, style='List Bullet')

    doc.save(filename)

if __name__ == '__main__':
    path1 = r"c:\Users\upthi\OneDrive\Escritorio\Reporte_Seguridad_OWASP_Sistema_TM.docx"
    path2 = r"c:\Users\upthi\Desktop\Reporte_Seguridad_OWASP_Sistema_TM.docx"
    create_simple_word_report(path1)
    try:
        create_simple_word_report(path2)
    except Exception:
        pass
    print("Documento sencillo de Word re-generado con éxito.")
