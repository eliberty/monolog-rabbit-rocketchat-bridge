# Monolog - Rabbitmq bridge to Rocketchat webhook

As of today, there is no existant monolog handler for rocketchat.
This bridge is here to fill the gap. Instead of sending directly messages to rocketchat, we send it via rabbitmq.

## Rabbitmq setup
Create an exchange (topic) that will receive all amqp json logs from monolog
It's possible to create one queue per needed topic

For exemple, it's possible to create a queue for app.channel and create bind with a routing key of app.channel

## Symfony setup
Monolog is setted up with an amq handler

```yaml
rabbit_handler:
    type: amqp
    exchange: amqp_exchange
    exchange_name: my_exchange.logs
    level: debug
```

## Rocketmail setup

Create a new incoming integration, no script is needed, and get back the server and token

## Launching the container

### Env vars

- RABBITMQ_HOST 
- RABBITMQ_PORT
- RABBITMQ_VHOST
- RABBITMQ_LOGIN
- RABBITMQ_PASSWORD
- RABBITMQ_QUEUE The queue to listen for incoming messages

- ROCKETMAIL_SERVER (https://my.rocket/server)
- ROCKETMAIL_WEBHOOK_TOKEN The token string for your webhook

