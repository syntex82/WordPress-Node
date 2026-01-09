/**
 * Order Confirmation Email Template
 * Beautiful order confirmation with detailed summary
 * Configured for NodePress - https://nodepress.co.uk
 */

import { getBaseEmailTemplate } from './base-template';

export function getOrderConfirmationTemplate(): string {
  const content = `
<!-- Hero Section -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="text-align: center; padding-bottom: 32px;">
      <div style="width: 100px; height: 100px; margin: 0 auto 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 48px; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);">
        ✓
      </div>
      <h1 style="margin: 0 0 12px; font-size: 32px; font-weight: 800; color: #f1f5f9; letter-spacing: -1px;">
        Order Confirmed!
      </h1>
      <p style="margin: 0; font-size: 16px; color: #94a3b8;">
        Order #<strong style="color: #10b981;">{{order.number}}</strong> • {{order.date}}
      </p>
    </td>
  </tr>
</table>

<!-- Main Message -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="padding-bottom: 32px;">
      <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.8; color: #cbd5e1;">
        Hi {{user.firstName}},
      </p>
      <p style="margin: 0; font-size: 16px; line-height: 1.8; color: #cbd5e1;">
        Thank you for your NodePress order! We've received it and are getting everything ready. You'll receive a confirmation as soon as your order is processed.
      </p>
    </td>
  </tr>
</table>
<!-- Order Items -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="padding-bottom: 32px;">
      <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 700; color: #f1f5f9;">Order Items</h3>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0f172a; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
        {{#each order.items}}
        <tr>
          <td style="padding: 16px 20px; border-bottom: 1px solid #334155;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="width: 70px; vertical-align: top; padding-right: 12px;">
                  {{#if this.image}}
                  <img src="{{this.image}}" alt="{{this.name}}" width="60" height="60" style="border-radius: 8px; object-fit: cover; display: block;">
                  {{else}}
                  <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #334155 0%, #1e293b 100%); border-radius: 8px;"></div>
                  {{/if}}
                </td>
                <td style="vertical-align: top;">
                  <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #f1f5f9;">{{this.name}}</p>
                  <p style="margin: 0 0 8px; font-size: 13px; color: #94a3b8;">Quantity: <strong>{{this.quantity}}</strong></p>
                  {{#if this.sku}}<p style="margin: 0; font-size: 12px; color: #64748b;">SKU: {{this.sku}}</p>{{/if}}
                </td>
                <td style="text-align: right; vertical-align: top;">
                  <p style="margin: 0; font-size: 15px; font-weight: 700; color: #10b981;">\${{this.total}}</p>
                  {{#if this.discount}}<p style="margin: 4px 0 0; font-size: 12px; text-decoration: line-through; color: #64748b;">\${{this.price}}</p>{{/if}}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        {{/each}}
      </table>
    </td>
  </tr>
</table>

<!-- Order Summary -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="padding-bottom: 32px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%); border-radius: 12px; padding: 24px; border: 1px solid #334155;">
        <tr>
          <td style="padding-bottom: 12px; border-bottom: 1px solid #334155;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td><p style="margin: 0; font-size: 14px; color: #94a3b8;">Subtotal</p></td>
                <td style="text-align: right;"><p style="margin: 0; font-size: 14px; color: #f1f5f9;">\${{order.subtotal}}</p></td>
              </tr>
            </table>
          </td>
        </tr>
        {{#if order.discount}}
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #334155;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td><p style="margin: 0; font-size: 14px; color: #94a3b8;">Discount</p></td>
                <td style="text-align: right;"><p style="margin: 0; font-size: 14px; color: #10b981; font-weight: 600;">-\${{order.discount}}</p></td>
              </tr>
            </table>
          </td>
        </tr>
        {{/if}}
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #334155;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td><p style="margin: 0; font-size: 14px; color: #94a3b8;">Shipping</p></td>
                <td style="text-align: right;"><p style="margin: 0; font-size: 14px; color: #f1f5f9;">{{#if order.shipping}}\${{order.shipping}}{{else}}<span style="color: #10b981; font-weight: 600;">Free</span>{{/if}}</p></td>
              </tr>
            </table>
          </td>
        </tr>
        {{#if order.tax}}
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #334155;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td><p style="margin: 0; font-size: 14px; color: #94a3b8;">Tax</p></td>
                <td style="text-align: right;"><p style="margin: 0; font-size: 14px; color: #f1f5f9;">\${{order.tax}}</p></td>
              </tr>
            </table>
          </td>
        </tr>
        {{/if}}
        <tr>
          <td style="padding-top: 12px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td><p style="margin: 0; font-size: 16px; font-weight: 800; color: #f1f5f9;">Total</p></td>
                <td style="text-align: right;"><p style="margin: 0; font-size: 20px; font-weight: 800; color: #10b981;">\${{order.total}}</p></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
<!-- Shipping & Billing Info -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="padding-bottom: 32px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          {{#if order.shippingAddress}}
          <td style="width: 50%; padding-right: 12px; vertical-align: top;">
            <h4 style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #f1f5f9;">📦 Shipping Address</h4>
            <p style="margin: 0; font-size: 13px; line-height: 1.8; color: #94a3b8;">
              {{order.shippingAddress.name}}<br>
              {{order.shippingAddress.street}}<br>
              {{order.shippingAddress.city}}, {{order.shippingAddress.state}} {{order.shippingAddress.zip}}<br>
              {{order.shippingAddress.country}}
            </p>
          </td>
          {{/if}}
          {{#if order.billingAddress}}
          <td style="width: 50%; padding-left: 12px; vertical-align: top;">
            <h4 style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #f1f5f9;">💳 Billing Address</h4>
            <p style="margin: 0; font-size: 13px; line-height: 1.8; color: #94a3b8;">
              {{order.billingAddress.name}}<br>
              {{order.billingAddress.street}}<br>
              {{order.billingAddress.city}}, {{order.billingAddress.state}} {{order.billingAddress.zip}}<br>
              {{order.billingAddress.country}}
            </p>
          </td>
          {{/if}}
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Next Steps -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="padding-bottom: 32px;">
      <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 700; color: #f1f5f9;">What's Next?</h3>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #334155;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="width: 30px; vertical-align: top; padding-right: 12px; font-size: 18px;">📧</td>
                <td>
                  <p style="margin: 0; font-size: 14px; color: #94a3b8;">
                    <strong style="color: #f1f5f9;">Order Confirmation</strong> - You'll receive updates via email as your order is processed
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="width: 30px; vertical-align: top; padding-right: 12px; font-size: 18px;">🎁</td>
                <td>
                  <p style="margin: 0; font-size: 14px; color: #94a3b8;">
                    <strong style="color: #f1f5f9;">Track Your Order</strong> - Click the button below to view your order status on {{site.name}}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- CTA Button -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="text-align: center; padding-bottom: 24px;">
      <a href="{{orderUrl}}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 8px; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);">
        View Your Order →
      </a>
    </td>
  </tr>
</table>

<!-- Support -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="padding-top: 24px; border-top: 1px solid #334155;">
      <p style="margin: 0; font-size: 13px; color: #94a3b8;">
        <strong style="color: #f1f5f9;">Questions?</strong> Our customer support team is ready to help. <a href="mailto:{{supportEmail}}" style="color: #10b981; text-decoration: none; font-weight: 600;">Contact us</a> anytime.
      </p>
    </td>
  </tr>
</table>`;

  return getBaseEmailTemplate(content, {
    preheader: 'Your NodePress order has been confirmed!',
  });
}
