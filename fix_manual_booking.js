const fs = require('fs');
const filepath = 'src/app/dashboard/bookings/manual-booking-dialog.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// 1. Add import
if (!content.includes("import { useBookingStore }")) {
    content = content.replace(
        "import { ja } from 'date-fns/locale'",
        "import { ja } from 'date-fns/locale'\nimport { useBookingStore } from '@/store/useBookingStore'"
    );
}

// 2. Add fetchBookings
if (!content.includes("const { fetchBookings } = useBookingStore()")) {
    content = content.replace(
        "const [step, setStep] = useState(1)",
        "const [step, setStep] = useState(1)\n\n    const { fetchBookings } = useBookingStore()"
    );
}

// 3. Call fetchBookings on success
if (!content.includes("fetchBookings(storeId)")) {
    content = content.replace(
        "toast.success('予約を作成しました')\n            setOpen(false)",
        "toast.success('予約を作成しました')\n            fetchBookings(storeId)\n            setOpen(false)"
    );
}

fs.writeFileSync(filepath, content);
console.log("Patched ManualBookingDialog.tsx successfully.");
