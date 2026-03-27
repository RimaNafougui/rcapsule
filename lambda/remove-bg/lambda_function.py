import json
import base64
import os
import shutil
from rembg import remove, new_session
from PIL import Image
from io import BytesIO
import requests

os.environ['NUMBA_CACHE_DIR'] = '/tmp'
os.environ['NUMBA_DISABLE_JIT'] = '1'

# Copy model from read-only /opt/models to writable /tmp/models on cold start
if os.path.exists('/opt/models') and not os.path.exists('/tmp/models'):
    shutil.copytree('/opt/models', '/tmp/models')

os.environ['U2NET_HOME'] = '/tmp/models'

# Load once on cold start — reused across invocations
session = new_session("birefnet-general")

def lambda_handler(event, context):
    try:
        body = json.loads(event['body']) if isinstance(event.get('body'), str) else event.get('body', {})
        image_url = body.get('imageUrl')
        image_base64 = body.get('imageBase64')

        if not image_url and not image_base64:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                'body': json.dumps({'error': 'imageUrl or imageBase64 is required'})
            }

        if image_url:
            print(f"Downloading from URL: {image_url}")
            response = requests.get(image_url, timeout=15)
            response.raise_for_status()
            image_data = response.content
        else:
            print("Processing base64 image")
            if ',' in image_base64:
                image_base64 = image_base64.split(',')[1]
            image_data = base64.b64decode(image_base64)

        print("Removing background...")
        input_image = Image.open(BytesIO(image_data))
        output_image = remove(input_image, session=session)

        buffer = BytesIO()
        output_image.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()

        print("Success!")
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({
                'success': True,
                'image': f'data:image/png;base64,{img_str}'
            })
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
