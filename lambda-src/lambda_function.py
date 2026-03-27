import json
import base64
import os
from PIL import Image
from io import BytesIO
import requests

# U2NET_HOME=/tmp is set via Lambda env var — writable, model downloads here on cold start
from rembg import remove, new_session

session = new_session("birefnet-general")

def lambda_handler(event, context):
    try:
        body = json.loads(event['body']) if isinstance(event.get('body'), str) else event.get('body', {})
        image_url = body.get('imageUrl')
        image_base64 = body.get('imageBase64')

        if not image_url and not image_base64:
            return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'imageUrl or imageBase64 is required'})}

        if image_url:
            response = requests.get(image_url, timeout=15)
            response.raise_for_status()
            image_data = response.content
        else:
            if ',' in image_base64:
                image_base64 = image_base64.split(',')[1]
            image_data = base64.b64decode(image_base64)

        input_image = Image.open(BytesIO(image_data))
        output_image = remove(input_image, session=session)

        buffer = BytesIO()
        output_image.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()

        return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True,
'image': f'data:image/png;base64,{img_str}'})}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {'statusCode': 500, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': str(e)})}