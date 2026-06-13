const token = 'vk1.a.ExVHjdLThGxCDYXG-YdBAlcrWkUBm9TIKrM_5qVpZ5dxfxtE_PGX91QZlFGz776t1eaknFsjW2L6-R5AYa4M79RH7jkaYuKxdywqvrLYS9D6FvN5_732xUj8DA6VECjEOfMFjdwGUa4zBSp5G8pi6wPWXPHZgoTJc_0CprCcp1n_oiAUiffjgUpqju2DzzS-3g8-QjPIAMdrwP2NaaluXQ';

async function testVK() {
  const params = new URLSearchParams({
    v: '5.131',
    access_token: token,
    screen_name: 'durov' 
  });
  
  const res = await fetch('https://api.vk.com/method/utils.resolveScreenName', {
    method: 'POST',
    body: params
  });
  
  const data = await res.json();
  console.log('Resolve response:', data);
}

testVK();
