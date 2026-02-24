export function translateAuthError(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('email rate limit exceeded')) {
        return 'メール送信の制限回数を超えました。しばらくして再度お試しください。';
    }
    if (lowerMessage.includes('invalid login credentials')) {
        return 'メールアドレスまたはパスワードが正しくありません。';
    }
    if (lowerMessage.includes('user already registered')) {
        return 'このメールアドレスは既に登録されています。';
    }
    if (lowerMessage.includes('password should be at least 6 characters') || lowerMessage.includes('password must be at least')) {
        return 'パスワードは最低6文字以上で入力してください。';
    }
    if (lowerMessage.includes('invalid email')) {
        return '有効なメールアドレスを入力してください。';
    }
    if (lowerMessage.includes('email not confirmed')) {
        return 'メールアドレスの確認が完了していません。受信トレイの確認メールより、認証を完了させてください。';
    }
    if (lowerMessage.includes('not authenticated')) {
        return '認証されていません。再度ログインしてください。';
    }
    if (lowerMessage.includes('23505') || lowerMessage.includes('unique constraint')) {
        return '既に存在するデータです。別の名前をお試しください。';
    }

    // Fallback translation
    return `エラーが発生しました (${message})`;
}
