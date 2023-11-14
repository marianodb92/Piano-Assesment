import csv
import requests
import base64
from io import StringIO


file_a_url = 'https://raw.githubusercontent.com/marianodb92/Piano-Assesment/main/file_a.csv'
file_b_url = 'https://raw.githubusercontent.com/marianodb92/Piano-Assesment/main/file_b.csv'


def search_email(email):

    url = "https://sandbox.piano.io/api/v3/publisher/user/search"
    params = {
        "aid" : 'o1sRRZSLlw',
        "api_token" : 'xeYjNEhmutkgkqCZyhBn6DErVntAKDx30FqFOS6D',
        "email" : email,
    }
    response = requests.get(url, params=params)

    if response.status_code == 200:
        user_data = response.json()
        users = user_data.get('users', [])
        if users:
            user_id = users[0].get('uid')
            return user_id
    return None

def read_csv_from_url(url):
    response = requests.get(url)
    if response.status_code == 200:
        return csv.DictReader(StringIO(response.text))
    return None

reader_a = read_csv_from_url(file_a_url)
file_a_data = {row['user_id']:{"user_id": row['user_id'], "email": row['email'] }for row in reader_a}

reader_b = read_csv_from_url(file_b_url)
for row in reader_b:
        data = file_a_data[row['user_id']]
        data['first_name'] = row['first_name']
        data['last_name']  = row['last_name']

for k,v in file_a_data.items():
    uid = search_email(v['email'])
    if uid:
        print('User {}  was already creating under id {}'.format(k, uid) )
        file_a_data[k]['user_id'] = uid


with open('merged_data.csv', mode='w', newline='') as merged_file:
    fieldnames = ['user_id', 'email', 'first_name', 'last_name']
    writer = csv.DictWriter(merged_file, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(file_a_data.values())

with open('merged_data.csv', mode='rb') as file_content:
    file_content_base64 = base64.b64encode(file_content.read()).decode('utf-8')
    content_api_url = "https://api.github.com/repos/marianodb92/Piano-Assessment/contents/merged_data.csv"
    headers = {'Accept': 'application/vnd.github.v3+json'}
    payload = {
        'message': "update merged_data.csv", 
        'content': file_content_base64,
    }
    response = requests.put(content_api_url, headers=headers, json=payload)

    if response.status_code == 200:
       print('Merged data written to merged_data.csv')