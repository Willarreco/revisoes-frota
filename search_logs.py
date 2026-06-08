import urllib.request
import json
import base64

def run():
    print("Fetching token with CORRECT credentials & User-Agent...")
    auth_url = 'https://posicoesgetrak.astransat.com.br/auth/token'
    credentials = base64.b64encode(b'warreco.sat:123456').decode('utf-8')
    
    headers = {
        'Authorization': f'Basic {credentials}',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    req = urllib.request.Request(
        auth_url,
        headers=headers,
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            print("Response status:", status)
            if status not in [200, 201]:
                print("Auth failed with status:", status)
                return
            data = json.loads(response.read().decode('utf-8'))
            token = data.get('token')
            print("SUCCESS: Token obtained successfully!")
            
            # Query the telemetry positions for plate SFX8A85 and SFX8a85
            plates = ['SFX8A85', 'SFX8a85']
            for p in plates:
                print(f"\nQuerying plate {p}...")
                query_url = f'https://posicoesgetrak.astransat.com.br/localizacao/{p}'
                q_req = urllib.request.Request(
                    query_url,
                    headers={
                        'Authorization': f'Bearer {token}',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                )
                try:
                    with urllib.request.urlopen(q_req) as q_res:
                        q_data = json.loads(q_res.read().decode('utf-8'))
                        print(f"Result for {p}:")
                        print(json.dumps(q_data, indent=2, ensure_ascii=False))
                except urllib.error.HTTPError as he:
                    print(f"Query HTTPError for {p}: {he.code} {he.reason}")
                except Exception as ex:
                    print(f"Query error for {p}: {ex}")
    except Exception as e:
        print("Auth Error:", e)

if __name__ == '__main__':
    run()
