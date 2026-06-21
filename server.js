const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// 1. REAL GOOGLE MAPS LEADS ROUTE
app.post('/api/get-leads', async (req, res) => {
    const { city, industry } = req.body;
    try {
        const response = await axios.get('https://api.outscraper.com/maps/search-v2', {
            params: {
                query: `${industry} in ${city}`,
                limit: 20, 
                drop_with_website: true, // Only returns businesses with NO website!
                async: false
            },
            headers: { 'X-API-KEY': process.env.OUTSCRAPER_API_KEY }
        });
        
        res.json({ success: true, leads: response.data.results });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error scanning live maps." });
    }
});

// 2. AI WEBSITE GENERATOR & TYPING EDITOR
app.post('/api/generate-website', async (req, res) => {
    const { businessName, city, phone, userEditPrompt } = req.body;
    
    let aiInstructions = `Generate a gorgeous modern single-page HTML website using Tailwind CSS for a business named "${businessName}" located in "${city}". Include a menu/services section, contact form, and display the phone number: ${phone}. Only return raw HTML code.`;
    if (userEditPrompt) {
        aiInstructions += ` Modify the existing design based on this specific user request: "${userEditPrompt}"`;
    }

    try {
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            contents: [{ parts: [{ text: aiInstructions }] }]
        });
        
        const generatedHTML = response.data.candidates[0].content.parts[0].text;
        res.json({ success: true, html: generatedHTML });
    } catch (error) {
        res.status(500).json({ success: false, message: "AI Website Generation Failed." });
    }
});

// 3. CONTACT FORM ROUTE FOR CLIENTS
app.post('/api/submit-form', async (req, res) => {
    const { clientEmail, customerMessage, customerName } = req.body;
    console.log(`Message from ${customerName} sent to client at ${clientEmail}`);
    res.json({ success: true, message: "Inquiry sent to business owner!" });
});

// 4. MANAGEMENT & USER EARNINGS TRACKING ROUTE
let mockUserEarningsDatabase = {
    "user_01": { totalVolume: 0, mrr: 0, availablePayout: 0 }
};

app.get('/api/earnings/:userId', (req, res) => {
    const userId = req.params.userId;
    const userBalance = mockUserEarningsDatabase[userId] || { totalVolume: 0, mrr: 0, availablePayout: 0 };
    res.json({
        success: true,
        totalBilled: `$${userBalance.totalVolume}`,
        monthlyRecurring: `$${userBalance.mrr}/mo`,
        availableForBankTransfer: `$${userBalance.availablePayout}`
    });
});

app.listen(3000, () => console.log('Global Agency Backend running on port 3000'));