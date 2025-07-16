# User System Architecture Specification

## User Types & Hierarchy

### 1. Personal Users
```javascript
{
  type: "personal",
  permissions: [
    "create_meals",
    "track_nutrition", 
    "scan_barcodes", // limited on free tier
    "view_own_data",
    "export_data"
  ],
  tierLimits: {
    free: {
      dailyScans: 5,
      mealHistory: 7, // days
      nutrients: ["basic"], // calories, protein, carbs, fat
      export: false
    },
    premium: {
      dailyScans: -1, // unlimited
      mealHistory: -1, // unlimited
      nutrients: ["all"], // 100+ nutrients
      export: true
    }
  }
}
```

### 2. Healthcare Practitioners
```javascript
{
  type: "practitioner",
  permissions: [
    ...personalUser.permissions,
    "manage_patients",
    "create_meal_templates",
    "view_patient_data",
    "generate_reports",
    "prescribe_meal_plans"
  ],
  features: {
    patientSlots: 10, // base
    additionalPatientCost: 2, // $/month
    templates: "unlimited",
    reportTypes: ["progress", "compliance", "nutrient_analysis"],
    brandingOptions: ["logo", "custom_colors"]
  }
}
```

### 3. Hospital/Organization Users
```javascript
{
  type: "organization",
  subTypes: ["hospital", "clinic", "wellness_center"],
  structure: {
    admins: [], // manage organization
    practitioners: [], // provide care
    staff: [], // support roles
    patients: [] // if direct management
  },
  permissions: {
    admin: [
      "manage_practitioners",
      "view_all_data",
      "configure_protocols",
      "access_analytics",
      "manage_billing"
    ],
    practitioner: [
      ...practitionerPermissions,
      "follow_protocols"
    ]
  }
}
```

## Authentication Flow

### 1. Registration Process

#### Personal Users
```javascript
// Frontend: Registration form
const registerPersonal = async (userData) => {
  // Step 1: Create Auth0 user
  const auth0User = await auth0.createUser({
    email: userData.email,
    password: userData.password,
    connection: 'Username-Password-Authentication',
    user_metadata: {
      tier: 'free',
      type: 'personal'
    }
  });

  // Step 2: Create database user
  const dbUser = await api.post('/users', {
    auth0_id: auth0User.user_id,
    email: userData.email,
    type: 'personal',
    tier: 'free',
    profile: {
      age: userData.age,
      sex: userData.sex,
      height: userData.height,
      weight: userData.weight
    }
  });

  // Step 3: Send welcome email
  await emailService.sendWelcome(userData.email);
  
  return { auth0User, dbUser };
};
```

#### Practitioner Registration
```javascript
const registerPractitioner = async (practitionerData) => {
  // Step 1: Verify credentials (license number, etc.)
  const verification = await verifyLicense({
    licenseNumber: practitionerData.licenseNumber,
    state: practitionerData.state,
    profession: practitionerData.profession
  });

  if (!verification.valid) {
    throw new Error('Invalid credentials');
  }

  // Step 2: Create Auth0 user with practitioner role
  const auth0User = await auth0.createUser({
    email: practitionerData.email,
    password: practitionerData.password,
    app_metadata: {
      roles: ['practitioner'],
      verified: true,
      licenseNumber: practitionerData.licenseNumber
    }
  });

  // Step 3: Create practitioner profile
  const practitioner = await api.post('/practitioners', {
    auth0_id: auth0User.user_id,
    ...practitionerData,
    verificationStatus: 'verified',
    tier: 'professional'
  });

  // Step 4: Setup Stripe customer
  const stripeCustomer = await stripe.customers.create({
    email: practitionerData.email,
    metadata: {
      user_id: practitioner.id,
      type: 'practitioner'
    }
  });

  return { auth0User, practitioner, stripeCustomer };
};
```

#### Organization Registration
```javascript
const registerOrganization = async (orgData, adminData) => {
  // Step 1: Create organization entity
  const organization = await api.post('/organizations', {
    name: orgData.name,
    type: orgData.type, // hospital, clinic, etc.
    taxId: orgData.taxId,
    address: orgData.address,
    tier: 'enterprise'
  });

  // Step 2: Create admin user
  const adminUser = await auth0.createUser({
    email: adminData.email,
    password: adminData.password,
    app_metadata: {
      roles: ['org_admin'],
      organization_id: organization.id
    }
  });

  // Step 3: Link admin to organization
  await api.post('/organization-members', {
    organization_id: organization.id,
    user_id: adminUser.user_id,
    role: 'admin'
  });

  // Step 4: Setup billing
  const billingAccount = await stripe.customers.create({
    email: orgData.billingEmail,
    name: orgData.name,
    metadata: {
      organization_id: organization.id,
      type: 'organization'
    }
  });

  return { organization, adminUser, billingAccount };
};
```

### 2. Login & Session Management

```javascript
// Universal login handler
const login = async (credentials) => {
  // Step 1: Authenticate with Auth0
  const authResult = await auth0.authenticate({
    username: credentials.email,
    password: credentials.password,
    scope: 'openid profile email'
  });

  // Step 2: Get user profile from database
  const userProfile = await api.get('/users/me', {
    headers: {
      Authorization: `Bearer ${authResult.accessToken}`
    }
  });

  // Step 3: Check subscription status
  const subscription = await api.get(`/subscriptions/${userProfile.id}`);

  // Step 4: Load organization context if applicable
  let orgContext = null;
  if (userProfile.organization_id) {
    orgContext = await api.get(`/organizations/${userProfile.organization_id}`);
  }

  // Step 5: Create session
  const session = {
    user: userProfile,
    subscription: subscription,
    organization: orgContext,
    permissions: getUserPermissions(userProfile, subscription),
    accessToken: authResult.accessToken,
    refreshToken: authResult.refreshToken,
    expiresAt: authResult.expiresIn + Date.now()
  };

  // Store in secure session storage
  await sessionStore.create(session);

  return session;
};
```

## Data Access Control

### 1. Personal User Data Access
```javascript
// Middleware for personal data access
const personalDataAccess = async (req, res, next) => {
  const userId = req.user.id;
  const resourceUserId = req.params.userId || req.body.userId;

  // Users can only access their own data
  if (userId !== resourceUserId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  next();
};

// API Routes
app.get('/users/:userId/meals', authenticate, personalDataAccess, getMeals);
app.get('/users/:userId/nutrition', authenticate, personalDataAccess, getNutrition);
```

### 2. Practitioner-Patient Access
```javascript
// Middleware for practitioner access to patient data
const practitionerPatientAccess = async (req, res, next) => {
  const practitionerId = req.user.id;
  const patientId = req.params.patientId;

  // Check if practitioner has access to this patient
  const relationship = await db.query(
    'SELECT * FROM practitioner_patients WHERE practitioner_id = ? AND patient_id = ? AND status = ?',
    [practitionerId, patientId, 'active']
  );

  if (!relationship) {
    return res.status(403).json({ error: 'No access to this patient' });
  }

  // Add relationship context
  req.patientRelationship = relationship;
  next();
};

// Patient management routes
app.get('/patients/:patientId/data', authenticate, practitionerPatientAccess, getPatientData);
app.post('/patients/:patientId/meal-plans', authenticate, practitionerPatientAccess, createMealPlan);
```

### 3. Organization Data Access
```javascript
// Organization data access control
const orgDataAccess = (requiredRole) => {
  return async (req, res, next) => {
    const userOrgId = req.user.organization_id;
    const targetOrgId = req.params.orgId || req.body.organization_id;

    // Check organization match
    if (userOrgId !== targetOrgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check role permissions
    const memberRole = await db.query(
      'SELECT role FROM organization_members WHERE user_id = ? AND organization_id = ?',
      [req.user.id, targetOrgId]
    );

    if (!hasPermission(memberRole.role, requiredRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Organization routes
app.get('/organizations/:orgId/analytics', authenticate, orgDataAccess('admin'), getOrgAnalytics);
app.post('/organizations/:orgId/practitioners', authenticate, orgDataAccess('admin'), addPractitioner);
```

## User Profile Components

### 1. Personal Profile Component
```jsx
// PersonalProfile.jsx
const PersonalProfile = () => {
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState(user.profile);

  const nutritionalNeeds = calculateNutritionalNeeds(profile);

  return (
    <Card>
      <CardHeader>
        <Typography variant="h5">Personal Profile</Typography>
        <Chip label={user.tier} color={user.tier === 'premium' ? 'primary' : 'default'} />
      </CardHeader>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Age"
              type="number"
              value={profile.age}
              onChange={(e) => setProfile({...profile, age: e.target.value})}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Select
              label="Biological Sex"
              value={profile.sex}
              onChange={(e) => setProfile({...profile, sex: e.target.value})}
            >
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Height (cm)"
              type="number"
              value={profile.height}
              onChange={(e) => setProfile({...profile, height: e.target.value})}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Weight (kg)"
              type="number"
              value={profile.weight}
              onChange={(e) => setProfile({...profile, weight: e.target.value})}
            />
          </Grid>
          <Grid item xs={12}>
            <Select
              label="Activity Level"
              value={profile.activityLevel}
              onChange={(e) => setProfile({...profile, activityLevel: e.target.value})}
            >
              <MenuItem value="sedentary">Sedentary</MenuItem>
              <MenuItem value="light">Lightly Active</MenuItem>
              <MenuItem value="moderate">Moderately Active</MenuItem>
              <MenuItem value="active">Very Active</MenuItem>
              <MenuItem value="extreme">Extremely Active</MenuItem>
            </Select>
          </Grid>
        </Grid>

        <Box mt={3}>
          <Typography variant="h6">Calculated Daily Needs</Typography>
          <List>
            <ListItem>
              <ListItemText primary="Calories" secondary={`${nutritionalNeeds.calories} kcal`} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Protein" secondary={`${nutritionalNeeds.protein}g`} />
            </ListItem>
            {user.tier === 'premium' && (
              <>
                <ListItem>
                  <ListItemText primary="Vitamins" secondary="View all 13 vitamins" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Minerals" secondary="View all 15 minerals" />
                </ListItem>
              </>
            )}
          </List>
        </Box>

        <Box mt={2}>
          <Button variant="contained" onClick={() => updateProfile(profile)}>
            Save Profile
          </Button>
          {user.tier === 'free' && (
            <Button variant="outlined" color="primary" sx={{ ml: 2 }}>
              Upgrade for Full Nutrient Tracking
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
```

### 2. Practitioner Dashboard
```jsx
// PractitionerDashboard.jsx
const PractitionerDashboard = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadPatients();
    loadStats();
  }, []);

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} md={3}>
          <StatCard
            title="Active Patients"
            value={stats.activePatients}
            subtitle={`of ${user.subscription.patientSlots} slots`}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Meal Plans Created"
            value={stats.mealPlansThisMonth}
            subtitle="This month"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Avg. Compliance"
            value={`${stats.avgCompliance}%`}
            subtitle="Across all patients"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Reports Generated"
            value={stats.reportsGenerated}
            subtitle="Last 30 days"
          />
        </Grid>

        {/* Patient List */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Your Patients"
              action={
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  disabled={patients.length >= user.subscription.patientSlots}
                >
                  Add Patient
                </Button>
              }
            />
            <CardContent>
              <DataGrid
                rows={patients}
                columns={[
                  { field: 'name', headerName: 'Patient Name', flex: 1 },
                  { field: 'age', headerName: 'Age', width: 80 },
                  { field: 'lastVisit', headerName: 'Last Activity', width: 150 },
                  { field: 'compliance', headerName: 'Compliance', width: 120,
                    renderCell: (params) => (
                      <LinearProgress 
                        variant="determinate" 
                        value={params.value} 
                        sx={{ width: '100%' }}
                      />
                    )
                  },
                  {
                    field: 'actions',
                    headerName: 'Actions',
                    width: 200,
                    renderCell: (params) => (
                      <Box>
                        <IconButton onClick={() => viewPatient(params.row.id)}>
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton onClick={() => createMealPlan(params.row.id)}>
                          <RestaurantIcon />
                        </IconButton>
                        <IconButton onClick={() => generateReport(params.row.id)}>
                          <AssessmentIcon />
                        </IconButton>
                      </Box>
                    )
                  }
                ]}
                pageSize={10}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Meal Plan Templates" />
            <CardContent>
              <List>
                {user.mealTemplates.map(template => (
                  <ListItem key={template.id}>
                    <ListItemText 
                      primary={template.name}
                      secondary={`${template.calories} kcal • ${template.usageCount} uses`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => editTemplate(template.id)}>
                        <EditIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
              <Button fullWidth variant="outlined" sx={{ mt: 2 }}>
                Create New Template
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
```

### 3. Organization Admin Panel
```jsx
// OrganizationAdmin.jsx
const OrganizationAdmin = () => {
  const { organization, user } = useAuth();
  const [practitioners, setPractitioners] = useState([]);
  const [inviteDialog, setInviteDialog] = useState(false);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {organization.name} Administration
      </Typography>

      <Tabs value={tabValue} onChange={handleTabChange}>
        <Tab label="Practitioners" />
        <Tab label="Patients" />
        <Tab label="Analytics" />
        <Tab label="Protocols" />
        <Tab label="Billing" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardHeader
            title={`Practitioners (${practitioners.length})`}
            action={
              <Button
                variant="contained"
                onClick={() => setInviteDialog(true)}
              >
                Invite Practitioner
              </Button>
            }
          />
          <CardContent>
            <DataGrid
              rows={practitioners}
              columns={[
                { field: 'name', headerName: 'Name', flex: 1 },
                { field: 'specialty', headerName: 'Specialty', width: 150 },
                { field: 'patientCount', headerName: 'Patients', width: 100 },
                { field: 'status', headerName: 'Status', width: 120,
                  renderCell: (params) => (
                    <Chip 
                      label={params.value} 
                      color={params.value === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  )
                },
                { field: 'lastActive', headerName: 'Last Active', width: 150 },
                {
                  field: 'actions',
                  headerName: 'Actions',
                  width: 150,
                  renderCell: (params) => (
                    <Box>
                      <IconButton onClick={() => managePractitioner(params.row.id)}>
                        <SettingsIcon />
                      </IconButton>
                      <IconButton onClick={() => viewPractitionerStats(params.row.id)}>
                        <BarChartIcon />
                      </IconButton>
                    </Box>
                  )
                }
              ]}
            />
          </CardContent>
        </Card>
      </TabPanel>

      {/* Invite Practitioner Dialog */}
      <Dialog open={inviteDialog} onClose={() => setInviteDialog(false)}>
        <DialogTitle>Invite New Practitioner</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            margin="normal"
          />
          <Select fullWidth margin="normal">
            <MenuItem value="nutritionist">Nutritionist</MenuItem>
            <MenuItem value="dietitian">Dietitian</MenuItem>
            <MenuItem value="physician">Physician</MenuItem>
            <MenuItem value="nurse">Nurse Practitioner</MenuItem>
          </Select>
          <FormGroup>
            <FormControlLabel
              control={<Checkbox />}
              label="Can manage other practitioners"
            />
            <FormControlLabel
              control={<Checkbox />}
              label="Can view organization analytics"
            />
            <FormControlLabel
              control={<Checkbox />}
              label="Can create protocols"
            />
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={sendInvite}>Send Invite</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
```

## Security Implementation

### 1. JWT Token Structure
```javascript
// Token payload for different user types
const generateToken = (user) => {
  const payload = {
    sub: user.id,
    email: user.email,
    type: user.type,
    tier: user.tier,
    permissions: user.permissions,
    organization_id: user.organization_id || null,
    practitioner_id: user.practitioner_id || null,
    iat: Date.now(),
    exp: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
  };

  return jwt.sign(payload, process.env.JWT_SECRET);
};
```

### 2. API Rate Limiting
```javascript
// Rate limiting by user tier
const rateLimiter = {
  free: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests
    message: 'Upgrade to Premium for higher API limits'
  }),
  premium: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000
  }),
  professional: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5000
  }),
  enterprise: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50000
  })
};

app.use((req, res, next) => {
  const tier = req.user?.tier || 'free';
  rateLimiter[tier](req, res, next);
});
```

### 3. Data Encryption
```javascript
// Encrypt sensitive health data
const encryptHealthData = (data) => {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};
```

This comprehensive user system architecture provides the foundation for a secure, scalable multi-tenant SaaS platform that can serve personal users, healthcare practitioners, and hospital organizations effectively.