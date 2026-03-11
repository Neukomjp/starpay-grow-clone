const fs = require('fs');
const filepath = 'src/app/dashboard/bookings/manual-booking-dialog.tsx';
let c = fs.readFileSync(filepath, 'utf8');

// Replace the target string precisely
c = c.replace(
  "        } catch (error) {\r\n            console.error(error)\r\n            toast.error('予約作成に失敗しました')",
  "        } catch (error: any) {\r\n            console.error(error)\r\n            toast.error(error.message || '予約作成に失敗しました')"
);
c = c.replace(
  "        } catch (error) {\n            console.error(error)\n            toast.error('予約作成に失敗しました')",
  "        } catch (error: any) {\n            console.error(error)\n            toast.error(error.message || '予約作成に失敗しました')"
);

fs.writeFileSync(filepath, c);
console.log('Patched manual-booking-dialog.tsx');
