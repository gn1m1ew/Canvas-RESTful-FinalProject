const amqp = require('amqplib');

const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost';
const rabbitmqUrl = `amqp://${rabbitmqHost}`;

async function main() {
    try {
        const connection = await amqp.connect(rabbitmqUrl);
        const channel = await connection.createChannel();
        await channel.assertQueue('echo');                                          // Connect to Rabbitmq
        
        // continue to run & listen the specific query "echo"
        channel.consume('echo', msg=>{
            if(msg){
                console.log("== New message consumed:", msg.content.toString());
            }
            channel.ack(msg);
        });

        setTimeout(() => connection.close(), 500);
    } catch (err) {
        console.error(err);
    }
}
main();



