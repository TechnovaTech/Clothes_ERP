# Platform Integration Guide

Quick integration guides for popular platforms and frameworks.

---

## 🎯 React / Next.js

### React Hook

```tsx
// hooks/usePlans.ts
import { useState, useEffect } from 'react';

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  maxProducts: number;
  features: string[];
}

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('https://erp.fashionpos.space/api/public/plans', {
      headers: {
        'x-api-key': process.env.NEXT_PUBLIC_ERP_API_KEY || ''
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPlans(data.data);
        } else {
          setError(data.error);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { plans, loading, error };
}
```

### Usage

```tsx
// components/PricingSection.tsx
import { usePlans } from '@/hooks/usePlans';

export default function PricingSection() {
  const { plans, loading, error } = usePlans();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {plans.map(plan => (
        <div key={plan.id} className="border rounded-lg p-6">
          <h3 className="text-2xl font-bold">{plan.name}</h3>
          <p className="text-4xl font-bold">₹{plan.price}</p>
          <p className="text-gray-600">{plan.description}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## 🌐 WordPress

### functions.php

```php
<?php
// Add to your theme's functions.php

function fetch_erp_plans() {
    $transient_key = 'erp_plans_cache';
    $cached = get_transient($transient_key);
    
    if ($cached !== false) {
        return $cached;
    }
    
    $api_key = get_option('erp_api_key', '');
    $response = wp_remote_get('https://erp.fashionpos.space/api/public/plans', [
        'headers' => [
            'x-api-key' => $api_key,
            'Content-Type' => 'application/json'
        ]
    ]);
    
    if (is_wp_error($response)) {
        return [];
    }
    
    $body = json_decode(wp_remote_retrieve_body($response), true);
    $plans = $body['success'] ? $body['data'] : [];
    
    // Cache for 1 hour
    set_transient($transient_key, $plans, HOUR_IN_SECONDS);
    
    return $plans;
}

// Shortcode: [erp_pricing]
function erp_pricing_shortcode($atts) {
    $plans = fetch_erp_plans();
    
    ob_start();
    ?>
    <div class="erp-pricing-grid">
        <?php foreach ($plans as $plan): ?>
            <div class="erp-plan-card">
                <h3><?php echo esc_html($plan['name']); ?></h3>
                <div class="price">₹<?php echo number_format($plan['price']); ?></div>
                <p><?php echo esc_html($plan['description']); ?></p>
                <ul class="features">
                    <?php foreach ($plan['features'] as $feature): ?>
                        <li><?php echo esc_html($feature); ?></li>
                    <?php endforeach; ?>
                </ul>
                <a href="#" class="button">Choose Plan</a>
            </div>
        <?php endforeach; ?>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('erp_pricing', 'erp_pricing_shortcode');

// Add settings page for API key
function erp_settings_page() {
    add_options_page(
        'ERP API Settings',
        'ERP API',
        'manage_options',
        'erp-api-settings',
        'erp_settings_page_html'
    );
}
add_action('admin_menu', 'erp_settings_page');

function erp_settings_page_html() {
    if (isset($_POST['erp_api_key'])) {
        update_option('erp_api_key', sanitize_text_field($_POST['erp_api_key']));
        echo '<div class="updated"><p>Settings saved!</p></div>';
    }
    
    $api_key = get_option('erp_api_key', '');
    ?>
    <div class="wrap">
        <h1>ERP API Settings</h1>
        <form method="post">
            <table class="form-table">
                <tr>
                    <th><label for="erp_api_key">API Key</label></th>
                    <td>
                        <input type="text" id="erp_api_key" name="erp_api_key" 
                               value="<?php echo esc_attr($api_key); ?>" 
                               class="regular-text">
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}
?>
```

### Usage in WordPress

1. Add the code to `functions.php`
2. Go to Settings → ERP API and enter your API key
3. Use shortcode `[erp_pricing]` in any page/post

---

## 🎨 HTML/CSS/JavaScript

### Standalone Implementation

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pricing Plans</title>
    <style>
        .pricing-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .pricing-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-top: 40px;
        }
        .plan-card {
            border: 1px solid #e0e0e0;
            border-radius: 10px;
            padding: 30px;
            text-align: center;
            transition: transform 0.3s;
        }
        .plan-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .plan-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .plan-price {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 20px;
        }
        .plan-features {
            list-style: none;
            padding: 0;
            margin: 20px 0;
            text-align: left;
        }
        .plan-features li {
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        .plan-features li:before {
            content: "✓ ";
            color: #4caf50;
            font-weight: bold;
        }
        .choose-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
    </style>
</head>
<body>
    <div class="pricing-container">
        <h1 style="text-align: center;">Choose Your Plan</h1>
        <div id="pricing-grid" class="pricing-grid"></div>
    </div>

    <script>
        const API_KEY = 'YOUR_API_KEY'; // Replace with your API key
        
        async function loadPlans() {
            try {
                const response = await fetch('https://erp.fashionpos.space/api/public/plans', {
                    headers: {
                        'x-api-key': API_KEY
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    displayPlans(data.data);
                }
            } catch (error) {
                console.error('Error loading plans:', error);
            }
        }
        
        function displayPlans(plans) {
            const grid = document.getElementById('pricing-grid');
            
            plans.forEach(plan => {
                const card = document.createElement('div');
                card.className = 'plan-card';
                
                const featuresHTML = plan.features
                    .map(f => `<li>${f}</li>`)
                    .join('');
                
                card.innerHTML = `
                    <div class="plan-name">${plan.name}</div>
                    <div class="plan-price">₹${plan.price.toLocaleString()}</div>
                    <p>${plan.description}</p>
                    <ul class="plan-features">${featuresHTML}</ul>
                    <button class="choose-btn" onclick="selectPlan('${plan.id}')">
                        Choose ${plan.name}
                    </button>
                `;
                
                grid.appendChild(card);
            });
        }
        
        function selectPlan(planId) {
            alert('Selected plan: ' + planId);
            // Redirect to signup or payment page
        }
        
        // Load plans on page load
        loadPlans();
    </script>
</body>
</html>
```

---

## 🐍 Python / Flask

```python
from flask import Flask, render_template, jsonify
import requests
import os
from functools import lru_cache
from datetime import datetime, timedelta

app = Flask(__name__)

API_KEY = os.getenv('ERP_API_KEY')
API_URL = 'https://erp.fashionpos.space/api/public/plans'

# Cache plans for 1 hour
cache = {'data': None, 'timestamp': None}

def get_plans():
    now = datetime.now()
    
    # Return cached data if less than 1 hour old
    if cache['data'] and cache['timestamp']:
        if now - cache['timestamp'] < timedelta(hours=1):
            return cache['data']
    
    try:
        response = requests.get(
            API_URL,
            headers={'x-api-key': API_KEY}
        )
        response.raise_for_status()
        data = response.json()
        
        if data.get('success'):
            cache['data'] = data['data']
            cache['timestamp'] = now
            return data['data']
    except Exception as e:
        print(f"Error fetching plans: {e}")
    
    return []

@app.route('/')
def index():
    return render_template('pricing.html')

@app.route('/api/plans')
def plans():
    return jsonify(get_plans())

if __name__ == '__main__':
    app.run(debug=True)
```

### Template (templates/pricing.html)

```html
<!DOCTYPE html>
<html>
<head>
    <title>Pricing Plans</title>
</head>
<body>
    <h1>Choose Your Plan</h1>
    <div id="plans"></div>
    
    <script>
        fetch('/api/plans')
            .then(res => res.json())
            .then(plans => {
                const container = document.getElementById('plans');
                plans.forEach(plan => {
                    const div = document.createElement('div');
                    div.innerHTML = `
                        <h2>${plan.name}</h2>
                        <p>₹${plan.price}/year</p>
                        <p>${plan.description}</p>
                    `;
                    container.appendChild(div);
                });
            });
    </script>
</body>
</html>
```

---

## 🟢 Node.js / Express

```javascript
const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');

const app = express();
const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

const API_KEY = process.env.ERP_API_KEY;
const API_URL = 'https://erp.fashionpos.space/api/public/plans';

async function fetchPlans() {
  // Check cache first
  const cached = cache.get('plans');
  if (cached) {
    return cached;
  }

  try {
    const response = await axios.get(API_URL, {
      headers: {
        'x-api-key': API_KEY
      }
    });

    if (response.data.success) {
      const plans = response.data.data;
      cache.set('plans', plans);
      return plans;
    }
  } catch (error) {
    console.error('Error fetching plans:', error);
  }

  return [];
}

app.get('/api/plans', async (req, res) => {
  const plans = await fetchPlans();
  res.json({ success: true, data: plans });
});

app.get('/pricing', async (req, res) => {
  const plans = await fetchPlans();
  res.render('pricing', { plans });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

---

## 🔷 Vue.js

```vue
<template>
  <div class="pricing-section">
    <h1>Choose Your Plan</h1>
    
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">{{ error }}</div>
    
    <div v-else class="plans-grid">
      <div v-for="plan in plans" :key="plan.id" class="plan-card">
        <h3>{{ plan.name }}</h3>
        <div class="price">₹{{ plan.price }}</div>
        <p>{{ plan.description }}</p>
        <ul>
          <li v-for="(feature, index) in plan.features" :key="index">
            {{ feature }}
          </li>
        </ul>
        <button @click="selectPlan(plan)">Choose Plan</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      plans: [],
      loading: true,
      error: null
    };
  },
  
  async mounted() {
    await this.fetchPlans();
  },
  
  methods: {
    async fetchPlans() {
      try {
        const response = await fetch('https://erp.fashionpos.space/api/public/plans', {
          headers: {
            'x-api-key': process.env.VUE_APP_ERP_API_KEY
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          this.plans = data.data;
        } else {
          this.error = data.error;
        }
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    
    selectPlan(plan) {
      console.log('Selected plan:', plan);
      // Handle plan selection
    }
  }
};
</script>

<style scoped>
.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.plan-card {
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 30px;
}

.price {
  font-size: 36px;
  font-weight: bold;
  color: #667eea;
}
</style>
```

---

## 🅰️ Angular

```typescript
// plans.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  maxProducts: number;
  features: string[];
}

@Injectable({
  providedIn: 'root'
})
export class PlansService {
  private apiUrl = 'https://erp.fashionpos.space/api/public/plans';
  private cachedPlans: Plan[] | null = null;

  constructor(private http: HttpClient) {}

  getPlans(): Observable<Plan[]> {
    if (this.cachedPlans) {
      return of(this.cachedPlans);
    }

    const headers = new HttpHeaders({
      'x-api-key': environment.erpApiKey
    });

    return this.http.get<any>(this.apiUrl, { headers }).pipe(
      map(response => {
        if (response.success) {
          this.cachedPlans = response.data;
          return response.data;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching plans:', error);
        return of([]);
      })
    );
  }
}

// pricing.component.ts
import { Component, OnInit } from '@angular/core';
import { PlansService } from '../services/plans.service';

@Component({
  selector: 'app-pricing',
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.css']
})
export class PricingComponent implements OnInit {
  plans: any[] = [];
  loading = true;

  constructor(private plansService: PlansService) {}

  ngOnInit() {
    this.plansService.getPlans().subscribe(plans => {
      this.plans = plans;
      this.loading = false;
    });
  }

  selectPlan(plan: any) {
    console.log('Selected plan:', plan);
  }
}
```

---

## 📱 React Native

```typescript
// hooks/usePlans.ts
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = 'YOUR_API_KEY';
const API_URL = 'https://erp.fashionpos.space/api/public/plans';
const CACHE_KEY = 'erp_plans_cache';
const CACHE_DURATION = 3600000; // 1 hour

export function usePlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      // Check cache first
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setPlans(data);
          setLoading(false);
          return;
        }
      }

      // Fetch from API
      const response = await fetch(API_URL, {
        headers: { 'x-api-key': API_KEY }
      });
      const result = await response.json();

      if (result.success) {
        setPlans(result.data);
        
        // Cache the result
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
          data: result.data,
          timestamp: Date.now()
        }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return { plans, loading, error, refresh: loadPlans };
}

// PricingScreen.tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { usePlans } from '../hooks/usePlans';

export default function PricingScreen() {
  const { plans, loading, error } = usePlans();

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error}</Text>;

  return (
    <FlatList
      data={plans}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.price}>₹{item.price}</Text>
          <Text>{item.description}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    margin: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#667eea',
  },
});
```

---

## 🔑 Environment Variables

### .env.local (Next.js/React)
```env
NEXT_PUBLIC_ERP_API_KEY=your_api_key_here
```

### .env (Node.js/Express)
```env
ERP_API_KEY=your_api_key_here
```

### .env (Vue.js)
```env
VUE_APP_ERP_API_KEY=your_api_key_here
```

### environment.ts (Angular)
```typescript
export const environment = {
  production: false,
  erpApiKey: 'your_api_key_here'
};
```

---

## 📞 Support

Need help with integration?
- 📧 Email: support@fashionpos.com
- 📱 Phone: +91 9427300816
- 📖 Full Docs: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
