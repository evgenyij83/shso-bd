export async function sendVkMessage(vkLink: string | null | undefined, message: string) {
  if (!vkLink) return;

  try {
    // Временно вшиваем токен, чтобы работало сразу на Vercel без настройки переменных окружения
    const token = process.env.VK_BOT_TOKEN || 'vk1.a.ExVHjdLThGxCDYXG-YdBAlcrWkUBm9TIKrM_5qVpZ5dxfxtE_PGX91QZlFGz776t1eaknFsjW2L6-R5AYa4M79RH7jkaYuKxdywqvrLYS9D6FvN5_732xUj8DA6VECjEOfMFjdwGUa4zBSp5G8pi6wPWXPHZgoTJc_0CprCcp1n_oiAUiffjgUpqju2DzzS-3g8-QjPIAMdrwP2NaaluXQ';

    let domain = vkLink.split('vk.com/').pop()?.split('/')[0]?.split('?')[0];
    if (!domain) return;
    
    let user_id;
    if (domain.startsWith('id')) {
      const potentialId = parseInt(domain.substring(2), 10);
      if (!isNaN(potentialId)) {
        user_id = potentialId;
      }
    }

    if (!user_id) {
      const resolveParams = new URLSearchParams({
        v: '5.131',
        access_token: token,
        screen_name: domain
      });
      const resolveRes = await fetch('https://api.vk.com/method/utils.resolveScreenName', { method: 'POST', body: resolveParams });
      const resolveData = await resolveRes.json();
      if (resolveData?.response?.type === 'user') {
        user_id = resolveData.response.object_id;
      }
    }

    if (!user_id) {
      console.error('Could not resolve VK user ID from domain:', domain);
      return;
    }

    const params = new URLSearchParams({
      v: '5.131',
      random_id: Math.floor(Math.random() * 2147483647).toString(),
      message: message,
      access_token: token,
      user_id: user_id.toString()
    });

    const response = await fetch('https://api.vk.com/method/messages.send', {
      method: 'POST',
      body: params,
    });

    const data = await response.json();
    console.log('VK API Response:', data);
  } catch (error) {
    console.error('Error sending VK message:', error);
  }
}
