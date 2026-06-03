export async function compressImage(imageURL: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = document.createElement("img");

    image.onload = (ev) => {
      const canvas = document.createElement("canvas");

      const maxSize = 128;

      const ratio =
        image.width > image.height ? 128 / image.width : 128 / image.height;

      canvas.width = 128;
      canvas.height = 128;

      const newImageWidth = image.width * ratio;
      const newImageHeight = image.height * ratio;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(
          image,
          (128 - newImageWidth) / 2,
          (128 - newImageHeight) / 2,
          newImageWidth,
          newImageHeight
        );
      } else {
        reject();
      }

      try {
        resolve(canvas.toDataURL("image/jpeg", 0.7));

        // ..toBlob(
        //   (blob) => {
        //     if (blob) {
        //       const compressedImage = new File([blob], "compressedImage.jpeg");
        //       resolve(compressedImage);
        //     }
        //   },
        //   "image/jpeg",
        //   0.7
        // );
      } catch (err) {
        reject();
      }
    };

    image.onerror = () => {
      reject();
    };

    image.src = imageURL;
  });
}
