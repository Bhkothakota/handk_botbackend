const { ActivityHandler, MessageFactory, CardFactory, ActivityTypes } = require('botbuilder');
const { createAboutHKCard } = require('./aboutHKCard');
const { createInitialCard } = require('./initialCard');
const { fetchContentsAndUrls } = require('./ApiConnection');
const { createTravelPolicyCard } = require('./travelPolicyCard');
const { createLocationsCard } = require('./locationCard');
const { createContactUsCard } = require('./contactUsCard');
const { createFeedbackCardSpanish } = require('./spanishgreet_feedback');
const { saveContextData } = require('./saveContextData');
const { saveFeedback } = require('./cosmosDbClient');
const NodeCache = require('node-cache');

class HKBot extends ActivityHandler {
    constructor() {
        super();
        this.feedbackCache = new NodeCache({ stdTTL: 3600 });
        this.onMembersAdded(async (context, next) => {
            const welcomeText = "Greetings! I’m askHK, your digital assistant at Holland & Knight. I’m here to assist you with IT issues and help with any policy questions. How can I help you today?";
            for (const member of context.activity.membersAdded) {
                if (member.id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText));
                }
            }
            await next();
        });

        this.onMessage(async (context, next) => {
            try {
                const text = (context.activity.text || '').trim().toLowerCase();
                const userId = context.activity.from.id;
                const userEmail = context.activity.channelData?.userInfo?.email || context.activity.from.email || "Unknown";

                if (text === 'hi' || text === 'hello' || text === 'help' || text === 'What is AskHK?' || text === 'What is askHK?' || text === 'What is AskHK' || text === 'What is askHK') {
                    const card = createInitialCard();
                    await context.sendActivity({ attachments: [card] });
                    return;
                }

                const sendTypingIndicator = async () => {
                    await context.sendActivity({ type: ActivityTypes.Typing });
                };

                const interval = setInterval(sendTypingIndicator, 1000); // Send typing indicator every second

                try {
                    // Simulate a delay for fetching data
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } finally { clearInterval(interval); }


                console.log("Received message:", text);
                console.log("Activity value:", context.activity.value);

                if (!text && !context.activity.value) {
                    await context.sendActivity("I didn't receive any input. Please try again.");
                    return;
                }

                if (context.activity.value) {
                    await this.handleAction(context, context.activity.value, userId);
                    return;
                }

                const { contents, urls, followupQueries } = await fetchContentsAndUrls(text, userId);
                if (!context.activity.value) {
                    // const { contents, urls, followupQueries } = await fetchContentsAndUrls(text, userId);

                    if (contents.length) {
                        console.log("Sending response card:", contents[0]);
                        await this.sendResponseCard(context, contents[0]);
                    }

                    if (urls.length) {
                        console.log("Sending URL list:", urls);
                        await this.sendUrlList(context, urls);
                    }

                    if (followupQueries.length) {
                        console.log("Sending follow-up queries:", followupQueries);
                        await this.sendFollowupQueries(context, followupQueries);
                    }

                    if (!contents.length && !urls.length && !followupQueries.length) {
                        await context.sendActivity("I'm not sure how to respond to that. Can you try rephrasing?");
                    }
                }
                const contextDataToSave = {
                    user_id: userId,
                    email: userEmail,
                    conversationId: context.activity.conversation.id,
                    sessionId: context.activity.id,
                    timestamp: new Date().toISOString(),
                    query: text,
                    response: { contents, urls, followupQueries },
                    channelId: context.activity.channelId,
                    userName: context.activity.from.name || "Unknown"
                };

                await saveContextData(contextDataToSave);
            } catch (error) {
                console.error('Error handling message:', error);
                await context.sendActivity('An error occurred while processing your request. Please try again later.');
            }
            await next();
        });
    }

    async sendResponseCard(context, response) {
        const card = CardFactory.adaptiveCard({

            "type": "AdaptiveCard",
            "version": "1.2",
            "body": [
                { type: 'TextBlock', text: response, wrap: true },
                {
                    "type": "Container",
                    "items": [
                        {
                            "type": "ColumnSet",
                            "columns": [
                                {
                                    "type": "Column",
                                    "width": "90",
                                    "items": [
                                        {
                                            "type": "TextBlock",
                                            "text": "We value your feedback. Please provide your thumbs impression:",
                                            "wrap": true,
                                            "size": "Small",
                                            "color": "Accent"
                                        }
                                    ]
                                },
                                {
                                    "type": "Column",
                                    "width": "5",
                                    "items": [
                                        {
                                            "type": "Image",
                                            "url": "data:image/svg+xml;utf8,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%20%20%3Cpath%20d%3D%22M16.4996%2017.9852C16.4996%2020.4271%2015.3595%2022.1838%2013.4932%2022.1838C12.5183%2022.1838%2012.1518%2021.6411%2011.8021%2020.3881L11.596%2019.6162C11.495%2019.2574%2011.3192%2018.6467%2011.069%2017.7852C11.0623%2017.7621%2011.0524%2017.7403%2011.0396%2017.7203L8.17281%2013.2346C7.49476%2012.1736%206.49429%2011.3581%205.31841%2010.9079L4.84513%2010.7267C3.5984%2010.2494%202.87457%208.94562%203.1287%207.63505L3.53319%205.54897C3.77462%204.30388%204.71828%203.31298%205.9501%203.01106L13.5778%201.14153C16.109%200.521138%2018.6674%202.05607%2019.3113%204.5814L20.7262%2010.1306C21.1697%2011.8698%2020.1192%2013.6393%2018.3799%2014.0828C18.1175%2014.1497%2017.8478%2014.1835%2017.5769%2014.1835H15.7536C16.2497%2015.8164%2016.4996%2017.0762%2016.4996%2017.9852ZM4.60127%207.92059C4.48576%208.5163%204.81477%209.10893%205.38147%209.3259L5.85475%209.5071C7.33036%2010.0721%208.58585%2011.0954%209.43674%2012.4268L12.3035%2016.9125C12.3935%2017.0534%2012.4629%2017.2064%2012.5095%2017.367L13.0614%2019.2873L13.2731%2020.0786C13.4125%2020.5666%2013.4827%2020.6838%2013.4932%2020.6838C14.3609%2020.6838%2014.9996%2019.6998%2014.9996%2017.9852C14.9996%2017.1007%2014.6738%2015.6497%2014.0158%2013.6701C13.8544%2013.1846%2014.2158%2012.6835%2014.7275%2012.6835H17.5769C17.7228%2012.6835%2017.868%2012.6653%2018.0093%2012.6293C18.9459%2012.3905%2019.5115%2011.4377%2019.2727%2010.5012L17.8578%204.952C17.4172%203.22415%2015.6668%202.17393%2013.9349%202.59841L6.30718%204.46794C5.64389%204.63051%205.13577%205.16407%205.00577%205.83451L4.60127%207.92059Z%22%20fill%3D%22%23212121%22%20%2F%3E%0A%3C%2Fsvg%3E",
                                            width: "15px",
                                            height: "15px",
                                            selectAction: {
                                                type: "Action.Submit",
                                                "data": {
                                                    "action": "dislike"
                                                }
                                            }
                                        }
                                    ]
                                },
                                {
                                    "type": "Column",
                                    "width": "5",
                                    "items": [
                                        {
                                            "type": "Image",
                                            "url": "data:image/svg+xml;utf8,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%20%20%3Cpath%20d%3D%22M16.4996%205.20259C16.4996%202.76065%2015.3595%201.00391%2013.4932%201.00391C12.467%201.00391%2012.1149%201.60527%2011.747%203.00348C11.6719%203.29233%2011.635%203.43297%2011.596%203.57157C11.495%203.93031%2011.3192%204.54106%2011.069%205.40258C11.0623%205.42566%2011.0524%205.44741%2011.0396%205.46749L8.17281%209.95315C7.49476%2011.0141%206.49429%2011.8296%205.31841%2012.2798L4.84513%2012.461C3.5984%2012.9384%202.87457%2014.2421%203.1287%2015.5527L3.53319%2017.6388C3.77462%2018.8839%204.71828%2019.8748%205.9501%2020.1767L13.5778%2022.0462C16.109%2022.6666%2018.6674%2021.1317%2019.3113%2018.6064L20.7262%2013.0572C21.1697%2011.3179%2020.1192%209.54845%2018.3799%209.10498C18.1175%209.03807%2017.8478%209.00422%2017.5769%209.00422H15.7536C16.2497%207.37133%2016.4996%206.11155%2016.4996%205.20259ZM4.60127%2015.2672C4.48576%2014.6715%204.81477%2014.0788%205.38147%2013.8619L5.85475%2013.6806C7.33036%2013.1157%208.58585%2012.0923%209.43674%2010.7609L12.3035%206.27526C12.3935%206.13437%2012.4629%205.98131%2012.5095%205.82074C12.7608%204.95574%2012.9375%204.34175%2013.0399%203.97786C13.083%203.82461%2013.1239%203.66916%2013.1976%203.38519C13.3875%202.66348%2013.4809%202.50391%2013.4932%202.50391C14.3609%202.50391%2014.9996%203.48797%2014.9996%205.20259C14.9996%206.08708%2014.6738%207.53803%2014.0158%209.51766C13.8544%2010.0032%2014.2158%2010.5042%2014.7275%2010.5042H17.5769C17.7228%2010.5042%2017.868%2010.5224%2018.0093%2010.5585C18.9459%2010.7973%2019.5115%2011.7501%2019.2727%2012.6866L17.8578%2018.2357C17.4172%2019.9636%2015.6668%2021.0138%2013.9349%2020.5893L6.30718%2018.7198C5.64389%2018.5572%205.13577%2018.0237%205.00577%2017.3532L4.60127%2015.2672Z%22%20fill%3D%22%23212121%22%20%2F%3E%0A%3C%2Fsvg%3E",
                                            width: "15px",
                                            height: "15px",
                                            selectAction: {
                                                type: "Action.Submit",
                                                "data": {
                                                    "action": "like"
                                                }
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },

            ]
        });
        await context.sendActivity({ attachments: [card] });
        console.log("Follow-up queries:", response.followupQueries);
        if (response.followupQueries && response.followupQueries.length) {
            await this.sendFollowupQueries(context, response.followupQueries);
        }
    }

    async sendUrlList(context, urls) {
        const urlMessage = urls.map(urlObj => `[${urlObj.title}](${urlObj.url})`).join('\n');
        await context.sendActivity(`Here are some links you might find useful:\n${urlMessage}`);
    }
    
    async sendFollowupQueries(context, followupQueries) {
        const card = CardFactory.adaptiveCard({
            type: 'AdaptiveCard',
            body: [{ type: 'TextBlock', text: 'Would you like to explore more information?', wrap: true }],
            actions: followupQueries.map(followup => ({
                type: 'Action.Submit',
                title: followup.button,
                data: { action: 'followup_query', query: followup.query }
            }))
        });
        await context.sendActivity({ attachments: [card] });
    }


    async handleAction(context, actionData, userId) {
  
        console.log("Handling action:", actionData);
       
        const userName = context.activity.from.name || "Unknown";
        const userEmail = context.activity.channelData?.userInfo?.email || context.activity.from.email || "Unknown";
        const { action, feedbackText, query } = actionData;
        
        // Function to handle feedback submission
        async function handleFeedbackSubmission(feedbackText, userQuery, feedbackType) {
            const feedbackData = {
                userId,
                userName,
                query: userQuery,
                email: userEmail,
                feedbackText,
                feedbackType, // Store the type of feedback (like or dislike)
                timestamp: new Date().toISOString(),
                conversationId: context.activity.conversation.id,
            };
    
            try {
                await saveFeedback(feedbackData);
                await context.sendActivity("Thank you for your feedback.");
            } catch (error) {
                console.error("Error saving feedback:", error);
                await context.sendActivity("Sorry, there was an issue saving your feedback. Please try again later.");
            }
        }

        const userQuery = context.activity.text || actionData.query;
        const feedbackKey = `${context.activity.value.activityId}:${context.activity.from.id}`; // Unique key for user and query
    
        switch (action) {
            case 'followup_query':
                console.log("Processing follow-up query:", query);
    
                try {
                    const followupResponse = await fetchContentsAndUrls(query, userId);
    
                    if (followupResponse && Array.isArray(followupResponse.contents) && followupResponse.contents.length > 0) {
                        await this.sendResponseCard(context, followupResponse.contents[0]);
                    } else {
                        await context.sendActivity("Sorry, no further information is available.");
                    }
                } catch (error) {
                    console.error("Error processing follow-up query:", error);
                    await context.sendActivity("Sorry, there was an issue processing your query. Please try again later.");
                }
                break;
    
            // case 'like':
            //     const likeFeedback = "Liked the interaction";
            //     console.log("User query:", userQuery);
            //     console.log("User feedback:", likeFeedback);
            //     await handleFeedbackSubmission.call(this, likeFeedback, userQuery, 'like'); // Store 'like' as feedbackType
            //     break;
    
            // case 'dislike':
            //     await this.sendFeedbackForm(context);
            //     break;
    
            // case 'submit_feedback':
            //     const feedbackText = actionData.feedbackText;
            //     console.log("User feedback:", feedbackText);
            //     console.log("User query:", userQuery);
            //     await handleFeedbackSubmission.call(this, feedbackText, userQuery, 'dislike'); // Store 'submit_feedback' as feedbackType
            //     break;
            case 'like':
            if (this.feedbackCache.get(feedbackKey)) {
                await context.sendActivity("You've already provided feedback for this interaction.");
                return;
            }
            const likeFeedback = "Liked the interaction";
            await handleFeedbackSubmission.call(this, likeFeedback, userQuery, 'like');
            this.feedbackCache.set(feedbackKey, true); // Mark feedback as submitted
            break;

        case 'dislike':
            if (this.feedbackCache.get(feedbackKey)) {
                await context.sendActivity("You've already provided feedback for this interaction.");
                return;
            }
            await this.sendFeedbackForm(context);
            this.feedbackCache.set(feedbackKey, true); // Mark feedback as submitted
            break;

        case 'submit_feedback':
            if (this.feedbackCache.get(feedbackKey)) {
                await context.sendActivity("You've already provided feedback for this interaction.");
                return;
            }
            const feedbackText = actionData.feedbackText;
            await handleFeedbackSubmission.call(this, feedbackText, userQuery, 'dislike');
            this.feedbackCache.set(feedbackKey, true); // Mark feedback as submitted
            break;
    
            case 'cancel_feedback':
                await context.sendActivity('Feedback submission has been cancelled.');
                break;
    
            case 'about_hk':
                const aboutCard = createAboutHKCard();
                await context.sendActivity({ attachments: [aboutCard] });
                break;
    
            case 'delete':
                await this.deleteCardActivityAsync(context);
                break;
    
            case 'show_locations':
                const locationsCard = createLocationsCard();
                await context.sendActivity({ attachments: [locationsCard] });
                break;
    
            case 'travel_policy':
                const travelPolicyCard = createTravelPolicyCard();
                await context.sendActivity({ attachments: [travelPolicyCard] });
                break;
    
            case 'contact_us':
                const contactUsCard = createContactUsCard();
                await context.sendActivity({ attachments: [contactUsCard] });
                break;
    
            case 'who_am_i':
                await context.sendActivity(`You are ${context.activity.from.name}`);
                break;
    
            case 'spanish_greet':
                const spanishGreetCard = createFeedbackCardSpanish();
                await context.sendActivity({ attachments: [spanishGreetCard] });
                break;
    
            default:
                await context.sendActivity('Unknown action received.');
                break;
        }
    }
    
    async sendFeedbackForm(context) {
        const feedbackCard = CardFactory.adaptiveCard({
            type: 'AdaptiveCard',
            body: [
                { type: 'TextBlock', text: 'Oh Sorry to hear that! Please provide more details below:', wrap: true },
                { type: 'Input.Text', id: 'feedbackText', placeholder: 'Enter your feedback here...', isMultiline: true }
            ],
            actions: [
                { type: 'Action.Submit', title: 'Submit Feedback', data: { action: 'submit_feedback' } },
                { type: 'Action.Submit', title: 'Cancel', data: { action: 'cancel_feedback' } }
            ]
        });
        await context.sendActivity({ attachments: [feedbackCard] });
    }

    async deleteCardActivityAsync(context) {
        await context.deleteActivity(context.activity.replyToId);
    }
}

module.exports.HKBot = HKBot;