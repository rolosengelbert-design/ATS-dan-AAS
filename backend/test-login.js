fetch('http://localhost:5000/api/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'sekjur', password: '1234566' })
}).then(res => res.json()).then(console.log).catch(console.error);
