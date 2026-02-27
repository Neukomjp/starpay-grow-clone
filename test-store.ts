import { createStoreAction } from './src/lib/actions/store'
import 'dotenv/config'

async function run() {
    try {
        console.log("Testing store creation...")
        const result = await createStoreAction("Test Store Node", "test-store-node")
        console.log("Success:", result)
    } catch (e: any) {
        console.error("Test Error:", e.message || e)
    }
}

run()
