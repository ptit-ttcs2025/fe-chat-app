
import { img_path } from '../../../environment';

interface Image {
  className?: string;
  src: string;
  alt?: string;
  height?: number;
  width?: number;
  id?: string;
}

const resolveSrc = (src: string): string => {
  if (!src) return '';

  // Giữ nguyên các URL đã đầy đủ (blob/data/http/https) để tránh tạo request tới Vite
  if (/^(blob:|data:|https?:)/i.test(src)) {
    return src;
  }

  // Nếu đã có slash đầu, coi như đường dẫn tuyệt đối trong app
  if (src.startsWith('/')) {
    return src;
  }

  // Ngược lại ghép với img_path mặc định
  return `${img_path}${src}`;
};

const ImageWithBasePath = (props: Image) => {
  const fullSrc = resolveSrc(props.src);

  return (
    <img
      className={props.className}
      src={fullSrc}
      height={props.height}
      alt={props.alt}
      width={props.width}
      id={props.id}
    />
  );
};

export default ImageWithBasePath;
