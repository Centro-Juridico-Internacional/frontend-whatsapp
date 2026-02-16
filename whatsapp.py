import time
from playwright.sync_api import sync_playwright

# Usa el mismo perfil que en tu otro script
RUTA_PERFIL_CHROME = r"C:\Users\USUARIO PC\AppData\Local\Google\Chrome\User Data\Profile 1"

def main():
    print("⚠️ IMPORTANTE: Cierra completamente Google Chrome antes de ejecutar este script.\n")
    time.sleep(2)

    with sync_playwright() as p:
        # Abrir Google Chrome real con tu perfil
        context = p.chromium.launch_persistent_context(
            user_data_dir=RUTA_PERFIL_CHROME,
            channel="chrome",           # Chrome real
            headless=False,             # Queremos ver la ventana
            viewport={"width": 1200, "height": 900},
        )

        # Usar pestaña existente o crear una nueva
        page = context.pages[0] if context.pages else context.new_page()

        # Ir a WhatsApp Web (puedes cambiar la URL si quieres otra página)
        print("📱 Abriendo https://web.whatsapp.com ...")
        page.goto("https://web.whatsapp.com", wait_until="load")

        print("\n✅ Navegador abierto con tu perfil.")
        print("   - Puedes usar WhatsApp Web normalmente.")
        print("   - El script NO cerrará el navegador.")
        print("   - Cuando quieras finalizar el script, vuelve a esta consola y pulsa ENTER.\n")

        try:
            input("🔚 Pulsa ENTER aquí para cerrar el navegador y terminar el script...")
        finally:
            # Si quieres que Chrome se cierre cuando pulses ENTER, dejamos context.close()
            context.close()
            print("👋 Navegador cerrado. Fin del script.")

if __name__ == "__main__":
    main()
