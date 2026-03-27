FROM public.ecr.aws/lambda/python:3.12

RUN dnf install -y libgomp gcc gcc-c++ && dnf clean all

RUN pip install --no-cache-dir "numpy==2.3.0"

RUN pip install --no-cache-dir \
    "rembg[cpu]" \
    Pillow \
    requests \
    "onnxruntime>=1.19.0"

COPY lambda_function.py ${LAMBDA_TASK_ROOT}/

CMD ["lambda_function.lambda_handler"]