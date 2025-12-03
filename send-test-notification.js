const webpush = require('web-push');
const fs = require('fs');

// Load keys
const vapidKeys = JSON.parse(fs.readFileSync('vapid.json', 'utf8'));

webpush.setVapidDetails(
    'mailto:soporte@resuelvemaestre.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

// Subscription object (Replace this with a real subscription from your DB)
// You can get this by logging the subscription in the console when you subscribe in the app
const pushSubscription = {
    endpoint: 'REPLACE_WITH_ENDPOINT',
    keys: {
        auth: 'REPLACE_WITH_AUTH',
        p256dh: 'REPLACE_WITH_P256DH'
    }
};

const payload = JSON.stringify({
    title: 'Prueba de Notificación',
    body: '¡Hola! Las notificaciones están funcionando correctamente.',
    url: 'https://resuelvemaestre.com'
});

webpush.sendNotification(pushSubscription, payload)
    .then(response => console.log('Sent successfully:', response.statusCode))
    .catch(error => console.error('Error sending:', error));
