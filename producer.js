const amqp = require('amqplib');

const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost';
const rabbitmqUrl = `amqp://${rabbitmqHost}`;

async function main() {
    try {
        const connection = await amqp.connect(rabbitmqUrl);
        const channel = await connection.createChannel();
        await channel.assertQueue('echo');

        // Sending data into the channel
        // const sentence = "The quick brown fox jumped over the lazy dog";
        // sentence.split(' ').forEach(word => {
        //     channel.sendToQueue('echo', Buffer.from(word));
        // });

        setTimeout(() => connection.close(), 500);
    } catch (err) {
        console.error(err);
    }
}
main();