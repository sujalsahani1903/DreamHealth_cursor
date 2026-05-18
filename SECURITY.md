# Security policy

## Reporting vulnerabilities

If you discover a security issue, please **do not** open a public GitHub issue with exploit details. Contact the repository owner privately.

## Safe development practices

- **Never commit** `.env`, `.env.local`, API keys, database passwords, or Stripe secrets.
- Use `backend/.env.example` and `frontend/.env.example` as templates only.
- Rotate credentials immediately if they were ever pushed to Git.
- In production:
  - Set `ALLOW_PUBLIC_ADMIN=false`
  - Use strong random `SECRET_KEY` and `JWT_SECRET_KEY`
  - Enable HTTPS on frontend and API
  - Restrict MySQL to your API host IP / VPC

## Dependencies

Keep Python and npm packages updated:

```bash
cd backend && pip install -U -r requirements.txt
cd frontend && npm audit
```
