import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get(`/products/${productId}`)
      const stock = await api.get(`/stock/${productId}`)
      const productTotalInCart = cart
        .filter(product => product.id === productId ?? product.amount)
        .map(product => product.amount)

      if (productTotalInCart >= stock.data.amount) {
        throw toast.error('Quantidade solicitada fora de estoque');
      }
      const { id, title, price, image } = response.data
      const product = cart.filter(product => product.id === productId);

      if (!product.length) {
        const product = [...cart,
        {
          id,
          title,
          price,
          image,
          amount: 1
        }
        ]

        setCart(product)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(product)
        )
      } else {
        const product = cart.map(product => {
          if (product.id === productId) {
            return { ...product, amount: product.amount + 1 }
          } else {
            return product
          }
        })
        setCart(product);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(product));
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const product = cart.filter(product => product.id === productId)

      if (product.length > 0) {
        const products = cart.filter(product => product.id !== productId);
        setCart(products);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(products));
      } else {
        throw Error();
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      };

      const stock = await api.get(`/stock/${productId}`)
      const stockAmount = stock.data.amount

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updateCart = [...cart];
      const productExists = updateCart.find(product => product.id === productId);

      if (productExists) {
        productExists.amount = amount;
        setCart(updateCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart));
      } else {
        throw Error();

      }
      // const products = cart.map(product => (
      //   product.id === productId
      //     ? { ...product, amount }
      //     : product
      // ));
      // setCart(products);
      // localStorage.setItem('@RocketShoes:cart', JSON.stringify(products));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
