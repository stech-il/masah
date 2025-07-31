# Render Setup Guide

## Database Persistence Issue

The database is being created in the wrong location on Render. Here's how to fix it:

### Current Issue
- **Expected**: `/opt/render/project/src/data/database.sqlite` (persistent disk)
- **Actual**: `/opt/render/project/database.sqlite` (ephemeral storage)

### Solution 1: Check Render Dashboard

1. Go to your Render dashboard: https://dashboard.render.com
2. Click on your `masah` service
3. Go to "Environment" tab
4. Check if `DATABASE_PATH` is set to: `/opt/render/project/src/data/database.sqlite`
5. If not, add it manually

### Solution 2: Manual Environment Variable

If the environment variable is not set in the dashboard:

1. In Render dashboard, go to your service
2. Click "Environment" tab
3. Add new environment variable:
   - **Key**: `DATABASE_PATH`
   - **Value**: `/opt/render/project/src/data/database.sqlite`
4. Click "Save Changes"
5. Redeploy the service

### Solution 3: Check Persistent Disk

1. In Render dashboard, go to your service
2. Look for "Disks" section
3. Verify that `database-disk` is mounted at `/opt/render/project/src/data`
4. If not, the disk configuration in `render.yaml` might need to be updated

### Debug Information

After deployment, check these URLs:
- System status: `https://masah.onrender.com/status`
- Disk debug: `https://masah.onrender.com/debug/disk`

The debug route will show:
- Environment variables
- File system permissions
- Persistent disk status
- Database file location

### Manual Backup

If you need to backup your current database:
```bash
npm run backup
```

This will create a backup in the `backups/` directory. 