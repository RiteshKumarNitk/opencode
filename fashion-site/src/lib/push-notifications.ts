import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  actions?: { action: string; title: string }[];
}

export async function savePushSubscription(userId: string, subscription: PushSubscription) {
  return prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    update: { userId },
  });
}

export async function removePushSubscription(endpoint: string) {
  return prisma.pushSubscription.delete({ where: { endpoint } }).catch(() => {});
}

export async function sendPushNotification(userId: string, payload: NotificationPayload) {
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  
  if (subscriptions.length === 0) return { sent: 0 };

  const webPush = require('web-push');
  
  const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAAnB8VgIsgvrFZqoRTK5-BstOyNuBTbbF4RUSZTKGTTiJZs7fLQ',
    privateKey: process.env.VAPID_PRIVATE_KEY || 'UUxI4O8-FbRouAf7-7OTt9jhLJ4EiSGdj1QclNvG-ZA',
  };

  webPush.setVapidDetails(
    'mailto:support@fashionstore.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );

  const results = await Promise.allSettled(
    subscriptions.map(sub =>
      webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ notification: payload, data: payload.data })
      ).catch(() => null)
    )
  );

  const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
  return { sent: successful, failed: subscriptions.length - successful };
}

export async function sendBatchNotification(userIds: string[], payload: NotificationPayload) {
  const results = await Promise.all(userIds.map(id => sendPushNotification(id, payload)));
  const totalSent = results.reduce((sum, r) => sum + r.sent, 0);
  return { sent: totalSent };
}

export const notificationTypes = {
  orderPlaced: (orderNumber: string) => ({
    title: 'Order Placed!',
    body: `Your order ${orderNumber} has been confirmed.`,
    icon: '/icons/order.png',
  }),
  orderShipped: (orderNumber: string, tracking?: string) => ({
    title: 'Order Shipped!',
    body: `Your order ${orderNumber} is on its way.${tracking ? ` Tracking: ${tracking}` : ''}`,
    icon: '/icons/shipping.png',
  }),
  orderDelivered: (orderNumber: string) => ({
    title: 'Order Delivered!',
    body: `Your order ${orderNumber} has been delivered.`,
    icon: '/icons/delivered.png',
  }),
  flashSale: (name: string, discount: number) => ({
    title: '⚡ Flash Sale Live!',
    body: `${name} - Up to ${discount}% OFF!`,
    icon: '/icons/flash.png',
  }),
  priceDrop: (productName: string, newPrice: number) => ({
    title: 'Price Drop Alert!',
    body: `${productName} is now ₹${newPrice}`,
    icon: '/icons/price.png',
  }),
  wishlistBack: (productName: string) => ({
    title: 'Back in Stock!',
    body: `${productName} is available now.`,
    icon: '/icons/stock.png',
  }),
};