import { Product, User } from '../types';

export interface ProductPurchaseAccess {
  permitted: boolean;
  requiresSignIn: boolean;
  reason: string;
}

export function getProductAccessForUser(
  product: Product,
  user: User | null
): ProductPurchaseAccess {
  if (!product.inStock) {
    return {
      permitted: false,
      requiresSignIn: false,
      reason: 'Out of stock',
    };
  }

  if (product.customerPurchasable === false) {
    if (user && user.role !== 'customer') {
      return {
        permitted: true,
        requiresSignIn: false,
        reason: 'Staff / wholesale catalog access',
      };
    }
    return {
      permitted: false,
      requiresSignIn: false,
      reason: 'Reserved for wholesale / staff',
    };
  }

  if (product.purchasableBy && product.purchasableBy.length > 0 && user) {
    if (!product.purchasableBy.includes(user.role)) {
      return {
        permitted: false,
        requiresSignIn: false,
        reason: 'Restricted to authorized roles',
      };
    }
  }

  if (!user) {
    return {
      permitted: false,
      requiresSignIn: true,
      reason: 'Sign in as a customer to purchase',
    };
  }

  if (user.status === 'suspended') {
    return {
      permitted: false,
      requiresSignIn: false,
      reason: 'Account suspended',
    };
  }

  if (user.role === 'customer' && user.permissions?.canPurchaseRetail === false) {
    return {
      permitted: false,
      requiresSignIn: false,
      reason: 'Retail purchasing disabled for account',
    };
  }

  return {
    permitted: true,
    requiresSignIn: false,
    reason: 'Permitted for customer purchase',
  };
}

export function isProductPermittedForCustomerCapacity(
  product: Product,
  user: User | null
): boolean {
  if (!product.inStock) return false;
  if (product.customerPurchasable === false) return false;
  if (product.purchasableBy && product.purchasableBy.length > 0) {
    const roleToCheck = user?.role || 'customer';
    if (!product.purchasableBy.includes(roleToCheck)) return false;
  }
  if (user?.status === 'suspended') return false;
  if (user?.role === 'customer' && user.permissions?.canPurchaseRetail === false) return false;
  return true;
}
