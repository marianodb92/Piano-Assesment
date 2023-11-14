const axios = require('axios');
const csv = require('csv-parser');
const fs = require('fs');

const file_a_url = 'https://raw.githubusercontent.com/marianodb92/Piano-Assesment/main/file_a.csv';
const file_b_url = 'https://raw.githubusercontent.com/marianodb92/Piano-Assesment/main/file_b.csv';

const searchEmail = async (email) => {
    const url = "https://sandbox.piano.io/api/v3/publisher/user/search";
    const params = {
        aid: 'o1sRRZSLlw',
        api_token: 'xeYjNEhmutkgkqCZyhBn6DErVntAKDx30FqFOS6D',
        email: email,
    };

    try {
        const response = await axios.get(url, { params });
        if (response.status === 200) {
            const user_data = response.data;
            const users = user_data.users || [];
            if (users.length > 0) {
                const user_id = users[0].uid;
                return user_id;
            }
        }
    } catch (error) {
        console.error('Error searching for email:', email, error.message);
    }

    return null;
};

const readCsvFromUrl = async (url) => {
    try {
        const response = await axios.get(url);
        if (response.status === 200) {
            return response.data.split('\n').map(row => row.split(','));
        }
    } catch (error) {
        console.error('Error reading CSV from URL:', url, error.message);
    }

    return null;
};

const mergeAndWriteCsv = async () => {
    const reader_a = await readCsvFromUrl(file_a_url);
    const file_a_data = {};
    
    if (reader_a) {
        for (const row of reader_a) {
            file_a_data[row[0]] = { user_id: row[0], email: row[1] };
        }
    }

    const reader_b = await readCsvFromUrl(file_b_url);
    if (reader_b) {
        for (const row of reader_b) {
            const data = file_a_data[row[0]];
            if (data) {
                data.first_name = row[1];
                data.last_name = row[2];
            }
        }
    }

    for (const [k, v] of Object.entries(file_a_data)) {
        const uid = await searchEmail(v.email);
        if (uid) {
            console.log(`User ${k} was already created under id ${uid}`);
            file_a_data[k].user_id = uid;
        }
    }

    const mergedDataCsv = 'merged_data.csv';
    const writer = fs.createWriteStream(mergedDataCsv);
    for (const v of Object.values(file_a_data)) {
        writer.write(`${v.user_id},${v.email},${v.first_name || ''},${v.last_name || ''}\n`);
    }
    writer.end();

    const fileContentBase64 = fs.readFileSync(mergedDataCsv, 'base64');
    const contentApiUrl = "https://api.github.com/repos/marianodb92/Piano-Assessment/contents/merged_data.csv";
    const headers = { 'Accept': 'application/vnd.github.v3+json' };

    try {
        const response = await axios.put(contentApiUrl, {
            message: "update merged_data.csv",
            content: fileContentBase64,
        }, { headers });

        if (response.status === 200) {
            console.log('Merged data written to merged_data.csv');
        }
    } catch (error) {
        console.error('Error updating GitHub content:', error.message);
    }
};

mergeAndWriteCsv();