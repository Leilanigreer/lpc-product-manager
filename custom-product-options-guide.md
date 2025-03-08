# Custom Product Options Implementation Guide

## Overview

This guide outlines the implementation of a custom product options system for Shopify using a Remix application. The system allows for dynamic product customization options that go beyond Shopify's native variant system, with conditional logic for displaying options based on user selections.

## Architecture

* **Backend**: Postgres database (on Railway) + Remix application
* **Frontend**: Remix + React for customer-facing product pages
* **Shopify Integration**: Storefront API for product data and cart operations

## Setup Steps

### 1. Data Model Integration

Ensure your Postgres database includes these key entities:

```
ProductOption
  - id
  - productId (or handle)
  - title
  - type (text, select, radio, etc.)
  - isRequired
  - displayOrder
  - values (for select/radio options)
  - priceAdjustment
  - ...

OptionRule
  - id
  - optionId
  - dependsOnOptionId
  - dependsOnValues
  - action (show/hide)
  - ...
```

### 2. Storefront API Setup

1. Create a Storefront API access token:
   - In your Shopify admin: Apps > Develop apps > Create an app
   - Enable Storefront API access
   - Generate a Storefront access token with appropriate scopes

2. Set up the Storefront API client in your Remix app:

```javascript
// app/lib/shopify.js
import { createStorefrontClient } from '@shopify/storefront-api-client';

export const storefront = createStorefrontClient({
  privateStorefrontToken: process.env.SHOPIFY_STOREFRONT_TOKEN,
  storeDomain: process.env.SHOPIFY_STORE_DOMAIN,
  apiVersion: '2023-10'  // Update with the current version
});
```

### 3. Product Data Fetcher

Create a loader for fetching product data along with custom options:

```javascript
// app/routes/products.$handle.jsx
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { storefront } from '~/lib/shopify';
import prisma from '~/lib/db.server';

export async function loader({ params }) {
  const { handle } = params;
  
  // Fetch base product data from Shopify
  const { data } = await storefront.query({
    query: `
      query ProductDetails($handle: String!) {
        product(handle: $handle) {
          id
          title
          description
          handle
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 5) {
            edges {
              node {
                url
                altText
                width
                height
              }
            }
          }
          variants(first: 100) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                availableForSale
              }
            }
          }
        }
      }
    `,
    variables: { handle }
  });

  // Fetch custom options and rules from your database
  const customOptions = await prisma.productOption.findMany({
    where: { 
      productHandle: handle 
    },
    include: {
      values: true,
      rules: {
        include: {
          dependsOnOption: true
        }
      }
    },
    orderBy: {
      displayOrder: 'asc'
    }
  });

  return json({
    product: data?.product,
    customOptions
  });
}
```

### 4. Product Customizer Component

Create a React component to handle custom option selection:

```jsx
// app/components/ProductCustomizer.jsx
import { useState, useEffect } from 'react';
import { Form, useSubmit } from '@remix-run/react';
import OptionField from './OptionField';

export default function ProductCustomizer({ product, customOptions }) {
  const [selections, setSelections] = useState({});
  const [visibleOptions, setVisibleOptions] = useState([]);
  const [basePrice, setBasePrice] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const submit = useSubmit();

  // Initialize base price
  useEffect(() => {
    if (product?.priceRange?.minVariantPrice?.amount) {
      const price = parseFloat(product.priceRange.minVariantPrice.amount);
      setBasePrice(price);
      setTotalPrice(price);
    }
  }, [product]);

  // Determine which options should be visible based on rules
  useEffect(() => {
    // Start with all options
    let visible = [...customOptions];
    
    // Apply rules based on current selections
    customOptions.forEach(option => {
      const rules = option.rules || [];
      
      rules.forEach(rule => {
        const dependsOnOption = rule.dependsOnOption;
        const dependsOnValue = rule.dependsOnValue;
        const currentValue = selections[dependsOnOption.id];
        
        // Hide option if rule conditions are met
        if (rule.action === 'HIDE' && currentValue === dependsOnValue) {
          visible = visible.filter(opt => opt.id !== option.id);
        }
        
        // Show option if rule conditions are met
        if (rule.action === 'SHOW' && currentValue !== dependsOnValue) {
          visible = visible.filter(opt => opt.id !== option.id);
        }
      });
    });
    
    setVisibleOptions(visible);
  }, [selections, customOptions]);

  // Calculate total price based on selections
  useEffect(() => {
    let additionalCost = 0;
    
    visibleOptions.forEach(option => {
      const selectedValue = selections[option.id];
      if (selectedValue) {
        const valueObj = option.values.find(v => v.value === selectedValue);
        if (valueObj && valueObj.priceAdjustment) {
          additionalCost += parseFloat(valueObj.priceAdjustment);
        }
      }
    });
    
    setTotalPrice(basePrice + additionalCost);
  }, [selections, visibleOptions, basePrice]);

  // Handle option changes
  const handleOptionChange = (optionId, value) => {
    setSelections(prev => ({
      ...prev,
      [optionId]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (event) => {
    event.preventDefault();
    
    // Prepare data for cart
    const formData = new FormData(event.target);
    formData.append('productId', product.id);
    formData.append('customizations', JSON.stringify(selections));
    
    submit(formData, { method: 'post', action: '/cart/add' });
  };

  return (
    <Form method="post" onSubmit={handleSubmit}>
      <input type="hidden" name="variantId" value={product.variants.edges[0]?.node.id} />
      
      {visibleOptions.map(option => (
        <OptionField
          key={option.id}
          option={option}
          value={selections[option.id] || ''}
          onChange={value => handleOptionChange(option.id, value)}
        />
      ))}
      
      <div className="price-display">
        <span className="price">${totalPrice.toFixed(2)}</span>
      </div>
      
      <button 
        type="submit" 
        className="add-to-cart-button"
        disabled={!product.variants.edges[0]?.node.availableForSale}
      >
        Add to Cart
      </button>
    </Form>
  );
}
```

### 5. Option Field Component

Create a component to render different option types:

```jsx
// app/components/OptionField.jsx
import { useState } from 'react';

export default function OptionField({ option, value, onChange }) {
  const { id, title, type, isRequired, values } = option;
  
  const renderOptionInput = () => {
    switch (type) {
      case 'TEXT':
        return (
          <input
            type="text"
            id={id}
            name={`option[${id}]`}
            value={value}
            onChange={e => onChange(e.target.value)}
            required={isRequired}
            className="w-full p-2 border border-gray-300 rounded"
          />
        );
        
      case 'SELECT':
        return (
          <select
            id={id}
            name={`option[${id}]`}
            value={value}
            onChange={e => onChange(e.target.value)}
            required={isRequired}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="">Select {title}</option>
            {values.map(val => (
              <option key={val.id} value={val.value}>
                {val.label} {val.priceAdjustment > 0 ? `(+$${val.priceAdjustment.toFixed(2)})` : ''}
              </option>
            ))}
          </select>
        );
        
      case 'RADIO':
        return (
          <div className="flex flex-col space-y-2">
            {values.map(val => (
              <label key={val.id} className="flex items-center">
                <input
                  type="radio"
                  name={`option[${id}]`}
                  value={val.value}
                  checked={value === val.value}
                  onChange={() => onChange(val.value)}
                  required={isRequired}
                  className="mr-2"
                />
                <span>
                  {val.label} {val.priceAdjustment > 0 ? `(+$${val.priceAdjustment.toFixed(2)})` : ''}
                </span>
              </label>
            ))}
          </div>
        );
        
      case 'CHECKBOX':
        return (
          <label className="flex items-center">
            <input
              type="checkbox"
              name={`option[${id}]`}
              checked={value === 'true'}
              onChange={e => onChange(e.target.checked ? 'true' : 'false')}
              className="mr-2"
            />
            <span>{title}</span>
          </label>
        );
        
      default:
        return <p>Unsupported option type: {type}</p>;
    }
  };
  
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {title} {isRequired && <span className="text-red-500">*</span>}
      </label>
      {renderOptionInput()}
    </div>
  );
}
```

### 6. Cart Integration

Create an action to handle adding customized products to cart:

```javascript
// app/routes/cart.add.jsx
import { redirect } from '@remix-run/node';
import { storefront } from '~/lib/shopify';
import prisma from '~/lib/db.server';

export async function action({ request }) {
  const formData = await request.formData();
  const variantId = formData.get('variantId');
  const customizations = JSON.parse(formData.get('customizations') || '{}');
  
  // Get or create cart
  const cartId = await getOrCreateCart(request);
  
  // Prepare attributes for Shopify cart
  const attributes = Object.entries(customizations).map(([key, value]) => {
    return { key, value: String(value) };
  });
  
  // Store customization details in your database for order processing
  await prisma.customization.create({
    data: {
      cartId,
      variantId,
      options: customizations,
      createdAt: new Date()
    }
  });
  
  // Add to Shopify cart
  await storefront.mutate({
    query: `
      mutation CartLineAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    variables: {
      cartId,
      lines: [
        {
          merchandiseId: variantId,
          quantity: 1,
          attributes
        }
      ]
    }
  });
  
  return redirect('/cart');
}

// Helper function to get or create cart
async function getOrCreateCart(request) {
  // Get cart ID from cookies
  const cookieHeader = request.headers.get('Cookie');
  const cookies = parseCookies(cookieHeader);
  let cartId = cookies.cartId;
  
  if (!cartId) {
    // Create new cart
    const { data } = await storefront.mutate({
      query: `
        mutation CreateCart {
          cartCreate {
            cart {
              id
            }
            userErrors {
              field
              message
            }
          }
        }
      `
    });
    
    cartId = data.cartCreate.cart.id;
    
    // Set cart ID in cookie
    // Note: In a real app, you'd use a more robust cookie solution
    return cartId;
  }
  
  return cartId;
}

// Simple cookie parser
function parseCookies(cookieHeader) {
  const cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      cookies[name] = value;
    });
  }
  return cookies;
}
```

### 7. Order Processing

When orders are placed, you'll need to retrieve the customization details:

```javascript
// app/routes/admin.orders.$id.jsx
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import prisma from '~/lib/db.server';

export async function loader({ params }) {
  const { id } = params;
  
  // Fetch Shopify order data using Admin API (requires different authentication)
  const order = await fetchShopifyOrder(id);
  
  // Fetch customizations for this order
  const customizations = await prisma.customization.findMany({
    where: {
      variantId: {
        in: order.lineItems.edges.map(edge => edge.node.variant.id)
      }
    }
  });
  
  return json({
    order,
    customizations
  });
}

// This would be implemented using Shopify Admin API
async function fetchShopifyOrder(id) {
  // Implementation depends on your Admin API setup
}
```

### 8. Image Selector Component

For options that use images (like swatch selectors):

```jsx
// app/components/ImageSelector.jsx
import { useState } from 'react';

export default function ImageSelector({ option, value, onChange }) {
  return (
    <div className="image-selector">
      <p className="text-sm font-medium text-gray-700 mb-2">
        {option.title} {option.isRequired && <span className="text-red-500">*</span>}
      </p>
      
      <div className="grid grid-cols-3 gap-2">
        {option.values.map(val => (
          <button
            key={val.id}
            type="button"
            className={`border p-1 rounded ${value === val.value ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}
            onClick={() => onChange(val.value)}
          >
            <img 
              src={val.imageUrl} 
              alt={val.label} 
              className="w-full h-auto object-contain"
            />
            <span className="block text-xs mt-1">
              {val.label}
              {val.priceAdjustment > 0 && <span className="block text-gray-500">(+${val.priceAdjustment.toFixed(2)})</span>}
            </span>
          </button>
        ))}
      </div>
      
      {option.isRequired && !value && (
        <p className="text-red-500 text-xs mt-1">Please select an option</p>
      )}
    </div>
  );
}
```

## Performance Considerations

1. **Caching Strategy**
   - Use Remix's built-in caching for product data
   - Consider implementing a Redis cache for frequently accessed products
   - Cache custom option configurations that rarely change

2. **Optimizing Database Queries**
   - Add indexes on frequently queried fields
   - Pre-load custom options for popular products
   - Consider denormalizing data for faster reads

3. **Front-end Optimizations**
   - Lazy-load images used in option selectors
   - Implement client-side caching with React Query or SWR
   - Use code splitting for components that aren't immediately visible

## Testing

1. **Unit Testing**
   - Test rule validation logic
   - Test price calculation functions
   - Test option visibility conditions

2. **Integration Testing**
   - Test database interactions
   - Test Shopify API integrations
   - Test form submission and validation

3. **End-to-End Testing**
   - Complete product configuration flow
   - Cart integration tests
   - Order processing tests

## Deployment Checklist

1. **Database**
   - Run migrations on Railway
   - Verify indexes are created
   - Backup existing data if updating schema

2. **Environment Variables**
   - Set Shopify API credentials
   - Configure database connection string
   - Set appropriate NODE_ENV

3. **Application**
   - Build and deploy Remix app to Railway
   - Verify Shopify webhook endpoints
   - Test customizer on live products

## Monitoring and Analytics

1. **Error Tracking**
   - Implement error logging for failed customizations
   - Set up alerts for high cart abandonment rates

2. **Usage Analytics**
   - Track most popular customization options
   - Analyze conversion rates for different option combinations
   - Monitor customization completion rates
