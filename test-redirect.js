const axios = require('axios');

async function testRedirect() {
    try {
        console.log('Testing club search redirect...');
        
        const clubName = 'Schachclub Steinfurt 1996 e V';
        const cleanClubName = clubName.replace(/[^a-zA-ZäöüÄÖÜß0-9\s]/g, '').trim();
        const searchUrl = `https://www.schachbund.de/verein.html?search=${encodeURIComponent(cleanClubName)}`;
        
        console.log(`Original URL: ${searchUrl}`);
        console.log(`Clean club name: ${cleanClubName}`);
        
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000,
            maxRedirects: 5
        });
        
        // Check different ways to get the final URL
        const finalUrl1 = response.request.res.responseUrl;
        const finalUrl2 = response.request.responseURL;
        const finalUrl3 = response.config.url;
        const finalUrl4 = response.request._currentUrl;
        
        console.log('Response status:', response.status);
        console.log('Final URL method 1 (responseUrl):', finalUrl1);
        console.log('Final URL method 2 (responseURL):', finalUrl2);
        console.log('Final URL method 3 (config.url):', finalUrl3);
        console.log('Final URL method 4 (_currentUrl):', finalUrl4);
        
        // Try to extract ZPS from any of the URLs
        const urls = [finalUrl1, finalUrl2, finalUrl3, finalUrl4].filter(Boolean);
        
        for (const url of urls) {
            const zpsMatch = url.match(/\/verein\/(\d+)\.html/);
            if (zpsMatch) {
                console.log(`✅ Found ZPS ${zpsMatch[1]} from URL: ${url}`);
                return zpsMatch[1];
            }
        }
        
        console.log('❌ No ZPS found in any URL');
        
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.log('Response status:', error.response.status);
            console.log('Response headers:', error.response.headers);
        }
    }
}

testRedirect();
