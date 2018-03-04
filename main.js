const amqp = require('amqplib');
const request = require('superagent');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

const RMQ_HOST = process.env.RABBITMQ_HOST || 'localhost';
const RMQ_PORT = process.env.RABBITMQ_PORT || 5672;
const RMQ_VHOST = process.env.RABBITMQ_VHOST || '/';
const RMQ_USER = process.env.RABBITMQ_USER || 'admin';
const RMQ_PASSWORD = process.env.RABBITMQ_PASSWORD || 'wxsuqseb';
const RMQ_QUEUE = process.env.RABBITMQ_QUEUE || 'dcipump.logs.q';

const ROCKETMAIL_SERVER = process.env.ROCKETMAIL_SERVER || 'http://localhost';
const ROCKETMAIL_WEBHOOK_TOKEN = process.env.ROCKETMAIL_WEBHOOK_TOKEN;

const webhook_endpoint = `${ROCKETMAIL_SERVER}/hooks/${ROCKETMAIL_WEBHOOK_TOKEN}`
const rabbit_cnx_string = `amqp://${RMQ_USER}:${RMQ_PASSWORD}@${RMQ_HOST}:${RMQ_PORT}${RMQ_VHOST}`

console.log('webhook_endpoint is now %s', webhook_endpoint);

const getFormattedMessage = (msg) => {
	return `[${msg.datetime.date}] ${msg.channel}.${msg.level_name}`
};

const getColor = (level) => {
	let color = '#000000';
	switch(parseInt(level)) {
		case 100:
			color = '#87ceff';
			break;
		case 200:
		case 250:
			color = '#0c457d';
			break;
		case 300:
			color = '#e8702a';
			break;
		case 400:
			color = '#f93737';
			break;
		case 500:
			color = '#c30505';
			break;
	}

	return color;
}

const convertMessage = (payload) => {
	const logMessage = JSON.parse(payload);
	let rocketMessage = {
		text: getFormattedMessage(logMessage)
	}
	let attachment = {
		color: getColor(logMessage.level),
		title: `${logMessage.message}`,
		text: 'Context and Extras',
		fields: []
	};

	if (logMessage.context) {
		const fields = Object.entries(logMessage.context);
		for (let [k, v] of fields) {
			attachment.fields.push({
				title: `ctx_${k}`,
				value: v,
				short: false,
			});
		}
	}

	rocketMessage.attachments = [attachment];

	return JSON.stringify(rocketMessage);
};

const postMessage = (payload) => {
	request
		.post(webhook_endpoint)
		.send(convertMessage(payload))
		.set('Content-Type', 'application/json')
		.then(function(res) {
			if (res.statusCode !== 200) {
				console.log('error %s', res.statusCode);
			}
		});
};

amqp.connect(rabbit_cnx_string).then(function(conn) {
  console.log('connected to rabbitmq');
  process.once('SIGINT', function() { conn.close(); });
  return conn.createChannel().then(function(ch) {

    var ok = ch.assertQueue(RMQ_QUEUE, {durable: true, autoDelete: false});

    ok = ok.then(function(_qok) {
      return ch.consume(RMQ_QUEUE, function(msg) {
        postMessage(msg.content.toString());
      }, {noAck: true});
    });

    return ok.then(function(_consumeOk) {
      console.log(' [*] Waiting for messages.');
    });
  });
}).catch(console.warn);
