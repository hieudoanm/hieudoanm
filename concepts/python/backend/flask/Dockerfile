FROM python:3.12.2

ENV ENVIRONMENT=production
ENV PORT=10000

COPY main.py main.py
COPY Makefile Makefile
COPY requirements.txt requirements.txt

RUN pip3 install -r requirements.txt
EXPOSE $PORT

ENTRYPOINT ["python3"]
CMD ["main.py"]
