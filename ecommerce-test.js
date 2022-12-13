import launcher from 'k6/x/browser';
import { sleep } from 'k6';

export default function() {
    // Inisialisasi browser yang akan di test
    // di sini, test akan dilakukan melalui chromium
    const browser = launcher.launch('chromium', { headless: false });
    const context = browser.newContext();
    const page = context.newPage();

    // Simulasi User
    // 1. User pergi ke homepage
    page.goto('http://ecommerce.k6.io', { waitUntil: 'networkidle'});
    page.waitForSelector('p[class="woocommerce-result-count"]');;
    page.screenshot('screenshot/01-homepage.png');

    sleep(Math.random() * 4);

    // 2. User melihat barang

    // 3. User ingin membeli sebuah barang
    // dan menambahkannya kedalam keranjang belanja

    // 4. User meliat keranjang belanjanya

    // 5. User melakukan checkout
}