const { CardFactory } = require('botbuilder');

module.exports.createInitialCard = () => {
    return CardFactory.adaptiveCard({
        "type": "AdaptiveCard",
        "version": "1.2",
        "body": [
           
            {
                "type": "TextBlock",
                "text": "Here are some things I can help with:",
                "size": "Default",  // Regular size text
                "wrap": true,
                "spacing": "Small"  // Adding some space between this and the next section
            },
            
            {
                "type": "Container",  // Container to group the actions for visibility
                "items": [
                    {
                        "type": "ActionSet",
                        "actions": [
                            {
                                "type": "Action.Submit",
                                "title": "About H&K",
                                "data": { "action": "about_hk" }
                            },
                            {
                                "type": "Action.Submit",
                                "title": "Travel Policy",
                                "data": { "action": "travel_policy" }
                            },
                          
                            {
                                "type": "Action.Submit",
                                "title": "Locations",
                                "data": { "action": "show_locations" }  // Added action for Locations
                            },
                            {
                                "type": "Action.Submit",
                                "title": "Contact Us",
                                "data": { "action": "contact_us" }
                            },
                            {
                                "type": "Action.Submit",
                                "title": "Who am I?",
                                "data": { "action": "who_am_i" }
                            },
                            {
                                "type": "Action.Submit",
                                "title": "Spanish Greet",
                                "data": { "action": "spanish_greet" }
                            },
                            {
                                "type": "Action.Submit",
                                "title": "Delete Card",
                                "data": { "action": "delete" }
                            },
                        ]
                    }
                ]
            },
        ]
    });
};
