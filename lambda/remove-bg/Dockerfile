FROM public.ecr.aws/lambda/python:3.12

# Install system dependencies (AL2023 uses dnf)
RUN dnf install -y libgomp gcc gcc-c++ && dnf clean all

# Install Python dependencies
RUN pip install --no-cache-dir \
    rembg[cpu] \
    Pillow \
    requests \
    onnxruntime

# Pre-download the birefnet-general model into the image
# so there is no download delay on cold start
ENV U2NET_HOME=/opt/models
RUN python -c "from rembg import new_session; new_session('birefnet-general')"

# Copy function code
COPY lambda_function.py ${LAMBDA_TASK_ROOT}/

CMD ["lambda_function.lambda_handler"]
