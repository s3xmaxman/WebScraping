import Product from "@/lib/models/product.models"
import { connectToDB } from "@/lib/mongoose"
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";
import { scrapeAmazonProduct } from "@/lib/scraper"
import { getAveragePrice, getEmailNotifType, getHighestPrice, getLowestPrice } from "@/lib/ulits";
import { NextResponse } from "next/server";


// この関数は最大300秒間実行することができます
export const maxDuration = 300;

// 強制的に動的なレスポンスを生成します
export const dynamic = "force-dynamic";

// レスポンスの再検証は行われません
export const revalidate = 0;

// GETリクエストを処理する関数です
export async function GET(request: Request) {
  try {
    connectToDB();

    // すべての商品をデータベースから取得します
    const products = await Product.find({});

    if (!products) throw new Error("商品が取得できませんでした。");

    // ======================== 1 最新の商品詳細をスクレイプしてデータベースを更新します
    const updatedProducts = await Promise.all(
      products.map(async (currentProduct) => {
        // 商品をスクレイプします
        const scrapedProduct = await scrapeAmazonProduct(currentProduct.url);

        if (!scrapedProduct) return;

        // 更新された価格履歴を作成します
        const updatedPriceHistory = [
          ...currentProduct.priceHistory,
          {
            price: scrapedProduct.currentPrice,
          },
        ];

        // 商品オブジェクトを更新します
        const product = {
          ...scrapedProduct,
          priceHistory: updatedPriceHistory,
          lowestPrice: getLowestPrice(updatedPriceHistory),
          highestPrice: getHighestPrice(updatedPriceHistory),
          averagePrice: getAveragePrice(updatedPriceHistory),
        };

        // データベース内の商品を更新します
        const updatedProduct = await Product.findOneAndUpdate(
          { url: product.url },
          product
        );

        // ======================== 2 各商品の状態を確認して、必要に応じてメールを送信します
        const emailNotifType = getEmailNotifType(
          scrapedProduct,
          currentProduct
        );

        if (emailNotifType && updatedProduct.users.length > 0) {
          // 商品情報を構築します
          const productInfo = {
            title: updatedProduct.title,
            url: updatedProduct.url,
          };
          // メールコンテンツを構築します
          const emailContent = await generateEmailBody(productInfo, emailNotifType);
          // ユーザーのメールアドレスの配列を取得します
          const userEmails = updatedProduct.users.map((user: any) => user.email);
          // メール通知を送信します
          await sendEmail(emailContent, userEmails);
        }

        return updatedProduct;
      })
    );

    // JSON形式でレスポンスを返します
    return NextResponse.json({
      message: "Ok",
      data: updatedProducts,
    });
  } catch (error: any) {
    throw new Error(`全ての商品の取得に失敗しました: ${error.message}`);
  }
}