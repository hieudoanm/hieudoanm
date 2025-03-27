# DevOps

## Table of Content

- [DevOps](#devops)
  - [Table of Content](#table-of-content)
  - [Hosting](#hosting)
    - [Infrastructure as a Service (I.a.a.S)](#infrastructure-as-a-service-iaas)
  - [API](#api)

## Hosting

### Infrastructure as a Service (I.a.a.S)

| Group           | Subgroup        | [AWS][aws]                                                 | [Azure][azure]        | [Google Cloud][google-cloud] | [Digital Ocean][do]                 | Render   | Vercel     |
| --------------- | --------------- | ---------------------------------------------------------- | --------------------- | ---------------------------- | ----------------------------------- | -------- | ---------- |
| BaaS            |                 |                                                            |                       | Firebase                     |                                     |          |            |
| Compute         |                 | [EC2][aws-ec2]                                             | Virtual Machines      | Compute Engine               |                                     |          |            |
| Container       | Registry        | [ECR][aws-ecr]                                             | Container Registry    | Container Registry           |                                     |          |            |
| Container       | Kubernetes      | [EKS][aws-eks]                                             | AKS                   | Kubernetes Engine            |                                     |          |            |
| Database        | Key-Value       | [ElasticCache][aws-elasticache]                            | Cache for Redis       |                              | Redis                               | Redis    | KV (Redis) |
| Database        | Document        |                                                            |                       | Firestore                    | MongoDB                             |          |            |
| Database        | Relational      | [RDS][aws-rds]                                             | Database for SQL      |                              | PostgreSQL                          | Postgres | Postgres   |
| Database        | Relational      |                                                            |                       |                              | MySQL                               |          |            |
| Database        | Search Engine   | [OpenSearch][aws-opensearch]                               |                       |                              |                                     |          |            |
| Database        | Multi Model     |                                                            | Cosmos DB             |                              |                                     |          |            |
| IaC             |                 | [CloudFormation][aws-cloudformation]                       |                       |                              |                                     |          |            |
| Files           | Block Storage   | [EBS][aws-ebs]                                             | Volumes Block Storage |                              |                                     |          | Blob       |
| Files           | Block Storage   | [EFS][aws-efs]                                             | Spaces Object Storage |                              |                                     |          |            |
| Files           | Files Storage   | [S3][aws-s3]                                               |                       |                              |                                     |          |            |
| Message Broker  |                 | [MQ](https://aws.amazon.com/amazon-mq/)                    |                       |                              |                                     |          |            |
| Message Broker  | [Kafka][kafka]  | [MSK](https://aws.amazon.com/msk/)                         |                       |                              |                                     |          |            |
| Networking      | DNS             | [Route 53][aws-route53]                                    | DNS                   | Cloud DNS                    | DNS                                 |          |            |
| Networking      | Firewall        |                                                            | Firewall              |                              | [Firewalls][do-firewalls]           |          |            |
| Networking      | IPs             |                                                            |                       |                              | [Reserved IPs][do-reserved-ips]     |          |            |
| Networking      | Load Balancing  | [ELB][aws-elb]                                             | Load Balancer         | Cloud Load Balancing         | [Load Balancers][do-load-balancers] |          |            |
| Networking      | Virtual Network | [VPC][aws-vpc]                                             | Virtual Network       | VPC                          | VPC                                 |          |            |
| PaaS            |                 | [Elastic Beanstalk][aws-elasticbeanstalk]                  | App Service           | Google App Engine            | App Platform                        |          |            |
| Secrets Manager |                 | [Secrets Manager](https://aws.amazon.com/secrets-manager/) | Key Vault             |                              |                                     |          |            |
| Serverless      |                 | [Lambda][aws-lambda]                                       | Functions             | Cloud Functions              |                                     |          |            |

## API

[aws]: https://aws.amazon.com/
[aws-cloudformation]: https://aws.amazon.com/cloudformation/
[aws-ebs]: https://aws.amazon.com/ebs/
[aws-ec2]: https://aws.amazon.com/ec2/
[aws-ecr]: https://aws.amazon.com/ecr/
[aws-efs]: https://aws.amazon.com/efs/
[aws-eks]: https://aws.amazon.com/eks/
[aws-elasticache]: https://aws.amazon.com/elasticache/
[aws-elasticbeanstalk]: https://aws.amazon.com/elasticbeanstalk/
[aws-elb]: https://aws.amazon.com/elasticloadbalancing/
[aws-lambda]: https://aws.amazon.com/lambda/
[aws-opensearch]: https://aws.amazon.com/opensearch-service/
[aws-rds]: https://aws.amazon.com/rds/
[aws-route53]: https://aws.amazon.com/route53/
[aws-s3]: https://aws.amazon.com/s3/
[aws-vpc]: https://aws.amazon.com/vpc/
[azure]: https://azure.microsoft.com/
[do]: https://docs.digitalocean.com
[do-firewalls]: https://docs.digitalocean.com/products/networking/firewalls/
[do-load-balancers]: https://docs.digitalocean.com/products/networking/load-balancers/
[do-reserved-ips]: https://docs.digitalocean.com/products/networking/reserved-ips/
[google-cloud]: https://cloud.google.com/
[kafka]: https://kafka.apache.org/
