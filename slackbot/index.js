var Botkit = require('botkit')

var slack_token = 'xoxb-453636783907-457612263508-J8UpoP0o7emZx2qdjplojMF1'
var wit_token = 'M34KN5Y2DRIM4ABKZIKB2K4VYNWG6L2A'


var Witbot = require('witbot')
var witbot = Witbot(wit_token)
var wit_req = require('./wit');
var news = require('./news')()

var controller = Botkit.slackbot({
  // reconnect to Slack RTM when connection goes bad
  retry: Infinity,
  debug: false
})

if (slack_token) {
  controller.spawn({
    token: slack_token,
    retry: Infinity
  }).startRTM(function (err, bot, payload) {
    if (err) {
      throw new Error(err)
    }

    console.log('Connected to Slack RTM')
  })
}

controller.on('bot_channel_join', function (bot, message) {
  bot.reply(message, "I'm in!")
})

controller.hears('.*', 'direct_message,direct_mention', function (bot, message) {
  var wit = witbot.process(message.text, bot, message)
  var wit_request = wit_req.request_wit(message.text);
  wit_request.when(function (err, wit) {
        if (err) {
          console.log(err);
        }

        var outcome = wit.outcomes[0]

        if(!outcome || !outcome.entities){
          bot.reply(message, 'I do not know what you mean.')
        } else {
          var intent = Object.keys(outcome.entities)[0]
		  console.log(intent)
          switch(intent){
            case 'greet':
              bot.reply(message, 'Hello. How may I help you  <@' + message.user + '>')
              break
            case 'id':
              var text = 'Best stupid Bot.'
              var attachments = [{
                fallback: text,
                pretext: 'Khanhhv Bot. :sunglasses: :thumbsup:',
                title: 'Khanhhv',
                title_link: 'https://github.com/khanhhv0911',
                text: text,
                color: '#39e600'
              }]

              bot.reply(message, {
                attachments: attachments
              }, function (error, resp) {
                console.log(error, resp)
              })
              break
            case 'status':
              bot.reply(message, 'I am ok. Thanks for asking.')
              break
            case 'insult':
              bot.reply(message, 'That is not vert nice. Talk to me when you have fixed your attitude.')
              break
            case 'news':
              var feed_url = "http://feeds.bbci.co.uk/news/rss.xml"
              console.log(news)
              news.getArticles(feed_url, function(error, data) {
                if(error){
                  console.log(error)
                  bot.reply(message, 'Unexpected error occured! Sorry.')
                  return
                }
                // news articles received - generate the attachments
                var i;
                for(i=0; i<10; i++){
                  var attachments = [{
                    title: data[i].title,
                    title_link: data[i].link,
                    text: data[i].content,
                    footer: data[i].published + " " + data[i].feed.name,
                    color: '#36a64f'
                  }]

                  bot.reply(message, {
                    attachments: attachments
                  })
                }
              })

              break
            default:
              bot.reply(message, 'I do not understand what you mean')
              break
          }
        }
  })
})
