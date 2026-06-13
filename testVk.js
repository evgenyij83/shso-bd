const token = 'vk1.a.ExVHjdLThGxCDYXG-YdBAlcrWkUBm9TIKrM_5qVpZ5dxfxtE_PGX91QZlFGz776t1eaknFsjW2L6-R5AYa4M79RH7jkaYuKxdywqvrLYS9D6FvN5_732xUj8DA6VECjEOfMFjdwGUa4zBSp5G8pi6wPWXPHZgoTJc_0CprCcp1n_oiAUiffjgUpqju2DzzS-3g8-QjPIAMdrwP2NaaluXQ';

async function testVK() {
  const resolveParams = new URLSearchParams({
    v: '5.131',
    access_token: token,
    screen_name: 'vasilyev004' 
  });
  
  const resolveRes = await fetch('https://api.vk.com/method/utils.resolveScreenName', {
    method: 'POST',
    body: resolveParams
  });
  
  const resolveData = await resolveRes.json();
  console.log('Resolve:', resolveData);
  
  if (resolveData?.response?.type === 'user') {
    const user_id = resolveData.response.object_id;
    console.log('User ID:', user_id);

    const params = new URLSearchParams({
      v: '5.131',
      random_id: Math.floor(Math.random() * 2147483647).toString(),
      message: 'Привет! Это тестовое сообщение.',
      access_token: token,
      user_id: user_id.toString()
    });

    const response = await fetch('https://api.vk.com/method/messages.send', {
      method: 'POST',
      body: params,
    });

    const data = await response.json();
    console.log('Send response:', data);
  } else {
    console.log('Failed to resolve user.');
  }
}

testVK();
