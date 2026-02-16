# Testing Pre-Registration Endpoint

## Using Postman

1. **Open Postman** and create a new request

2. **Set Request Type:**
   - Method: `POST`
   - URL: `http://localhost:5000/api/pre-register`

3. **Set Headers:**
   - Key: `Content-Type`
   - Value: `application/json`

4. **Set Body:**
   - Select "raw" and "JSON" format
   - Paste this example:
   ```json
   {
     "name": "John Doe",
     "mobileNumber": "1234567890",
     "companyName": "Test Company",
     "groupId": "",
     "code": ""
   }
   ```

5. **Click Send**

## Using cURL (Command Line)

```bash
curl -X POST http://localhost:5000/api/pre-register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "mobileNumber": "1234567890",
    "companyName": "Test Company",
    "groupId": "",
    "code": ""
  }'
```

## Using Node.js Test Script

Run the provided test script:
```bash
cd backend
node scripts/testPreRegister.js
```

## Expected Responses

### Success (200/201):
```json
{
  "preRegistrationId": "...",
  "message": "Pre-registration and company registration submitted successfully",
  "data": { ... },
  "company": { ... }
}
```

### Update Existing (200):
```json
{
  "preRegistrationId": "...",
  "message": "Pre-registration updated successfully",
  "updated": true,
  ...
}
```

### Error (400):
```json
{
  "error": "Missing required fields: name, mobileNumber, companyName"
}
```
