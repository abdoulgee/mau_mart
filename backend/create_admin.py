import os
import sys
from app import create_app, db
from app.models import User, UserRole

def create_super_admin(first_name, last_name, email, phone, password):
    app = create_app(os.getenv('FLASK_ENV', 'development'))
    with app.app_context():
        # Check if user already exists
        user = User.query.filter_by(email=email.lower()).first()
        if user:
            print(f"Error: User with email {email} already exists.")
            return

        # Create user
        user = User(
            first_name=first_name,
            last_name=last_name,
            email=email.lower(),
            phone=phone,
            role=UserRole.SUPER_ADMIN.value,
            is_verified=True,
            is_active=True
        )
        user.set_password(password)

        try:
            db.session.add(user)
            db.session.commit()
            print(f"Successfully created super-admin: {email}")
        except Exception as e:
            db.session.rollback()
            print(f"Error creating user: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 6:
        print("Usage: python create_admin.py <first_name> <last_name> <email> <phone> <password>")
        sys.exit(1)

    create_super_admin(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5])
