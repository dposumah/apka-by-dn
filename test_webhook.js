async function testWebhook() {
  const webhookUrl = "https://script.google.com/macros/s/AKfycbx4HtXH816rxAkcPV44wM5VEp9cgJ7DQ0aLv9TMAIkDtGUVVRrVS8pRPAxL9mCuAVJe/exec";
  const perihal = "TESTING - TESTING";
  const noUrut = "999";
  const tanggalFormatted = "27/09/2026";
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ perihal, noUrut, tanggal: tanggalFormatted }),
      redirect: 'follow',
    });
    
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Raw:', text);
  } catch (e) {
    console.error(e);
  }
}
testWebhook();
