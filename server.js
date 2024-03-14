const express = require('express');
import('node-fetch').then(({ default: fetch }) => {
}).catch(err => {
    console.error('Failed to import node-fetch:', err);
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/:formId/filteredResponses', async (req, res) => {
    try {
        const formId = req.params.formId;
        const filters = req.query.filters ? JSON.parse(req.query.filters) : [];
        const apiKey = process.env.API_KEY || 'default_api_key';

        const apiUrl = `https://api.fillout.com/v1/api/forms/${formId}/submissions`;

        // Fetch responses from Fillout API
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch form responses. Status: ${response.status}`);
        }

        const responseData = await response.json();

        const filteredResponses = applyFilters(responseData.responses, filters);

        const responseObject = {
            responses: filteredResponses,
            totalResponses: responseData.totalResponses,
            pageCount: responseData.pageCount
        };

        res.json(responseObject);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

function applyFilters(responses, filters) {
    return responses.filter(response => {
        return filters.every(filter => {
            const { id, condition, value } = filter;
            const question = response.questions.find(question => question.id === id);

            console.log('Question ID:', id);
            console.log('Question Value:', question ? question.value : 'Question not found');

            if (!question) {
                return false; 
            }

            switch (condition) {
                case 'equals':
                    return question.value === value;
                case 'greater_than':
                    return question.value > value;
                default:
                    return true;
            }
        });
    });
}


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});