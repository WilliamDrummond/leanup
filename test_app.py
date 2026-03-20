from playwright.sync_api import sync_playwright
import time

def test_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:8000')
        print("Page loaded successfully.")

        # We don't have login credentials, but we can verify the login page loads
        # without Javascript errors.
        page.wait_for_selector('.auth-card')
        print("Auth card found.")

        # Let's check for console errors
        errors = []
        page.on("pageerror", lambda err: errors.append(err.message))
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)

        time.sleep(2) # Give it time to render
        if len(errors) > 0:
            print("Console errors found:")
            for err in errors:
                print(err)
            raise Exception("Javascript errors detected!")
        else:
            print("No console errors detected.")

        browser.close()

if __name__ == '__main__':
    test_app()
