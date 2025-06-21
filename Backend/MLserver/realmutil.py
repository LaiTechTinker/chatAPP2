import sys
import json
import base64
import numpy as np
import cv2
import joblib
from wavelet import w2d

__model=None
def decode_base64_image():
    for line in sys.stdin:
        data = json.loads(line)
        b64_image = data.get('image')

        if not b64_image:
            raise ValueError("No image data provided") 

        nparr = np.frombuffer(base64.b64decode(b64_image), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img

def get_cropped_image_if_2_eyes():
    face_cascade = cv2.CascadeClassifier('./opencv/haarcascades/haarcascade_frontalface_default.xml')
    eye_cascade = cv2.CascadeClassifier('./opencv/haarcascades/haarcascade_eye.xml')
    
    img2 = decode_base64_image()
    gray = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    cropped_faces = []
    for (x,y,w,h) in faces:
        roi_gray = gray[y:y+h, x:x+w]
        roi_color = img2[y:y+h, x:x+w]
        eyes = eye_cascade.detectMultiScale(roi_gray)
        if len(eyes) >= 2:
            cropped_faces.append(roi_color)
    return cropped_faces

def classify_image():
 try:
    imgs = get_cropped_image_if_2_eyes()

    
    for img in imgs: 
        scalled_raw_img = cv2.resize(img, (32, 32))
        img_har = w2d(img, 'db1', 5)
        scalled_img_har = cv2.resize(img_har, (32, 32))
        combined_img = np.vstack((scalled_raw_img.reshape(32 * 32 * 3, 1), scalled_img_har.reshape(32 * 32, 1)))

        len_image_array = 32*32*3 + 32*32

        final = combined_img.reshape(1,len_image_array).astype(float)
        # result.append({
        #     'class': class_number_to_name(__model.predict(final)[0]),
        #     'class_probability': np.around(__model.predict_proba(final)*100,2).tolist()[0],
        #     'class_dictionary': __class_name_to_number
        # })
    global __model
    if __model is None:
        with open('./Artifacts/image_model.pkl', 'rb') as f:
            __model = joblib.load(f)
    # print("loading saved artifacts...done")
    result=__model.predict(final)
    print(result)
    sys.stdout.flush()
 except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.stdout.flush()
    # return result
   

# def encode_image_to_base64():
#     try:
#         cropped_faces = get_cropped_image_if_2_eyes()
#         if not cropped_faces:
#             raise ValueError("No face with 2 eyes found")
        
#         img = cropped_faces[0]
#         success, buffer = cv2.imencode('.jpg', img)
#         if not success:
#             raise ValueError("Could not encode image")

#         b64_encoded = base64.b64encode(buffer).decode('utf-8')
#         print(b64_encoded)
#         sys.stdout.flush()
#     except Exception as e:
#         print(json.dumps({"error": str(e)}))
#         sys.stdout.flush()

if __name__ == "__main__":
    # encode_image_to_base64()
     classify_image()

