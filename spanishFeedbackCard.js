const { CardFactory } = require('botbuilder');

function createFeedbackCardInSpanish() {
    return CardFactory.adaptiveCard({
        "type": "AdaptiveCard",
        "version": "1.2",
        "body": [
            {
                "type": "TextBlock",
                "text": "¡Gracias por tu retroalimentación! Por favor, proporciona más detalles a continuación:",
                "wrap": true
            },
            {
                "type": "Input.Text",
                "id": "feedbackText",
                "placeholder": "Ingresa tu retroalimentación aquí...",
                "isMultiline": true
            },
            {
                "type": "ActionSet",
                "actions": [
                    {
                        "type": "Action.Submit",
                        "title": "Enviar Retroalimentación",
                        "data": {
                            "action": "submit_feedback"
                        }
                    },
                    {
                        "type": "Action.Submit",
                        "title": "Cancelar",
                        "data": {
                            "action": "cancel_feedback"
                        }
                    }
                ]
            },
            {
                "type": "TextBlock",
                "text": `\\**This is a demo chatbot made only for some queries.\\**`,
                "size": "Small",  // Small and subtle, so it doesn't distract from the main content
                "isSubtle": true,  // Making the text subtle
                "wrap": true,
                "spacing": "Small"  // Spacing to separate it from the previous content
            }
        ]
    });
}

module.exports.createFeedbackCardInSpanish = createFeedbackCardInSpanish;
