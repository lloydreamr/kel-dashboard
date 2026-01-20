# Backup Verification

## Current Configuration

| Setting | Value |
|---------|-------|
| **Platform** | Supabase |
| **Project Name** | kel-dashboard |
| **Project Region** | us-east-1 |
| **Organization** | Lloydiee's Org |
| **Project Tier** | Free |
| **Database Version** | PostgreSQL 17.6.1 |
| **Backup Schedule** | Daily (automatic) |
| **Retention Period** | 7 days |
| **PITR Available** | No (Pro tier required) |
| **Last Verified** | 2026-01-01 |

## NFR14 Compliance Status

| Requirement | Target | Current | Status |
|-------------|--------|---------|--------|
| Backup Frequency | Daily | Daily | ✅ Compliant |
| Retention Period | 14 days | 7 days | ⚠️ Partial |
| Point-in-Time Recovery | Required | Not Available | ⚠️ Not Available |

### Overall Status: **Partial Compliance**

The Free tier provides daily automated backups with 7-day retention. Full NFR14 compliance requires upgrading to the Pro tier for:
- 14-day backup retention
- Point-in-Time Recovery (PITR)
- More granular restore options

## Upgrade Path

To achieve full NFR14 compliance:

1. **Upgrade to Pro tier** ($25/month)
   - Supabase Dashboard → Organization Settings → Billing
   - Select Pro plan

2. **Benefits of Pro tier:**
   - 14-day backup retention
   - Point-in-Time Recovery
   - 8GB database storage
   - Daily backups with longer history

3. **Recommendation:**
   - For MVP with Free tier, current 7-day retention is acceptable
   - Upgrade to Pro before production launch or when data becomes critical

## Verification Steps

To verify backup configuration manually:

1. Navigate to [Supabase Dashboard](https://app.supabase.com)
2. Select project: **kel-dashboard**
3. Go to: Project Settings → Database → Backups
4. Verify:
   - Backup schedule shows "Daily"
   - Most recent backup timestamp is within 24 hours
   - Retention period matches tier (7 days for Free)

## Recovery Procedure

### Standard Recovery (Free Tier)

1. Log into Supabase Dashboard
2. Navigate to: Project Settings → Database → Backups
3. Select the desired backup from the list (up to 7 days old)
4. Click "Restore"
5. Confirm the restore operation
6. Wait for restore to complete (may take several minutes)

### Recovery Request (Support)

For issues with standard recovery:

1. Contact Supabase support via Dashboard
2. Provide:
   - Project reference: `hgayodotajqqsdovmwsg`
   - Desired restore point timestamp
   - Description of issue
3. Request restoration to staging environment first
4. Verify data integrity before production restore

## Data Integrity Verification

After any restore operation:

1. Run data integrity tests: `npm run test:run src/lib/repositories/__tests__/data-integrity.test.ts`
2. Verify critical tables have expected row counts
3. Spot-check recent decisions and questions
4. Verify all foreign key relationships are intact

## Related Requirements

- **NFR12**: Zero data loss for decisions → Verified via data integrity tests
- **NFR13**: Auto-save < 5 seconds → Verified via debounce timing tests
- **NFR14**: Daily backups, 14-day retention → **Partial** (7-day retention on Free tier)

## Changelog

| Date | Change |
|------|--------|
| 2026-01-01 | Initial verification - Free tier, 7-day retention |
